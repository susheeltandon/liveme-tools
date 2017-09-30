/*
	Downloader Module
*/

const { app, ipcMain, dialog } = require('electron');

const path = require('path'),
    ffmpeg = require('fluent-ffmpeg'),
    fs = require('fs-extra'),
    isDev = require('electron-is-dev'),
    shell = require('shelljs'),
    eventEmitter = new (require('events').EventEmitter)();

var appSettings = null,
    download_queue = [],
    download_history = [],
    can_run = true,
    is_running = false,
    running_instance = null;

module.exports = {
    events: eventEmitter,

    /*
        Expecting data in this format:
        user: {
            id: 123,
            name: "name"
        },
        video: {
            id: 123,
            title: "name",
            time: 123,
            url: 'http://xyz.m3u8'
        }
    */
    add: function (obj) {
        if (download_queue.length == 0) {
            eventEmitter.emit('show-queue');
        }

        download_queue.push(obj);
        eventEmitter.emit('add', { id: obj.video.id, value: obj.video.url });
        saveQueue();

        if (!is_running && can_run) {
            runDownloader();
        }
    },

    /*
        Removes an item from the queue
    */
    remove: function (vid) {
        let index = -1;

        for (i = 0; i < download_queue.length; i++) {
            if (download_queue[i].video.id == vid) {
                index = i;
                break;
            }
        }

        if (index != -1) {
            download_queue.splice(index, 1);
            saveQueue();
            eventEmitter.emit('remove', { id: vid });
            return true;
        }

        return false;
    },

    /*
        Starts/Resumes downloading
    */
    start: function () {
        if (!is_running && can_run) {
            runDownloader();
        }
    },

    /*
        Stops downloading any new files after the one(s) it's downloading now, until told to start again
    */
    pause: function () {
        can_run = false;
        eventEmitter.emit('pause');
    },

    /*
        Resumes downloading
    */

    resume: function () {
        can_run = true;
        eventEmitter.emit('resume');

        if (!is_running && can_run) {
            runDownloader();
        }
    },

    init: function (settings) {
        appSettings = settings;

        ffmpeg.setFfmpegPath(appSettings.get('downloads.ffmpeg'));
        ffmpeg.setFfprobePath(appSettings.get('downloads.ffprobe'));
    },

    /*
        Called on startup
    */
    load: function () {
        loadQueue();
        loadHistory();
    },

    /*
        Called on shutdown
    */
    forceSave: function () {
        saveQueue();
        saveHistory();
    },

    isRunning: function () {
        return is_running;
    },

    isPaused: function () {
        return !can_run; // If it can't run, it is paused
    },

    /*
        Checks if a video is in the download history
    */
    hasBeenDownloaded: function (videoid) {
        return download_history.indexOf(videoid) != -1;
    },

    purgeHistory: function () {
        fs.removeSync(path.join(app.getPath('appData'), app.getName(), 'downloadHistory.json'));
        download_history = [];
    },

    purgeQueue: function () {
        download_queue = [];
        saveQueue();
        eventEmitter.emit('clear-queue');
    },

    killActiveDownload: function () {
        if (running_instance) {
            running_instance.kill();
        }
    },

    detectFFMPEG: function() {
        return new Promise((resolve, reject) => {
            ffmpeg.getAvailableCodecs((err, codecs) => {
                return resolve(!err);
            });
        });
    },

    setFfmpegPath: function(path) {
        ffmpeg.setFfmpegPath(path);
    },

    setFfprobePath: function(path) {
        ffmpeg.setFfprobePath(path);
    }
};

function loadQueue() {
    fs.readFile(path.join(app.getPath('appData'), app.getName(), 'downloadQueue.json'), 'utf8', function (err, data) {
        if (err) {
            download_queue = [];
        } else {
            try {
                download_queue = JSON.parse(data);
            } catch (err) {
                download_queue = [];
            }
        }

        if (download_queue.length > 0) {
            for (i = 0; i < download_queue.length; i++) {
                eventEmitter.emit('add', { id: download_queue[i].video.id, value: download_queue[i].video.url });
            }

            runDownloader();
        }
    });
}

function saveQueue() {
    fs.writeFile(path.join(app.getPath('appData'), app.getName(), 'downloadQueue.json'), JSON.stringify(download_queue), 'utf8', () => { });
}

function loadHistory() {
    if (!appSettings.get('downloads.history')) {
        return;
    }

    fs.readFile(path.join(app.getPath('appData'), app.getName(), 'downloadHistory.json'), 'utf8', function (err, data) {
        if (err) {
            download_history = [];
        } else {
            try {
                download_history = JSON.parse(data);
            } catch (err) {
                download_history = [];
            }
        }
    });
}

function saveHistory() {
    if (!appSettings.get('downloads.history')) {
        return;
    }

    fs.writeFile(path.join(app.getPath('appData'), app.getName(), 'downloadHistory.json'), JSON.stringify(download_history), 'utf8', () => { });
}

/*
    Pop an item from the queue and process it here
*/
function processItem(item) {
    return new Promise((resolve, reject) => {
        let localFilename = getLocalFilename(item);
        let remoteFilename = item.video.url;

        running_instance = ffmpeg(remoteFilename)
            .outputOptions([
                '-c copy',
                '-bsf:a aac_adtstoasc',
                '-vsync 2',
                '-movflags +faststart'
            ])
            .on('end', function (stdout, stderr) {
                if (appSettings.get('downloads.history')) {
                    download_history.push(item.video.id);
                }

                eventEmitter.emit('finish', { id: item.video.id });
                running_instance = null;
                resolve();
            })
            .on('progress', function (progress) {
                eventEmitter.emit('progress', { id: item.video.id, url: item.video.url, value: progress.percent });
            })
            .on('start', function (c) {
                eventEmitter.emit('start', { id: item.video.id, url: item.video.url });
            })
            .on('error', function (err, stdout, stderr) {
                eventEmitter.emit('fail', { id: item.video.id });
                running_instance = null;
                resolve();
            })
            .save(localFilename.replace(".ts", ".mp4"));
    });
}

/*
    Starts processing the download queue until it's paused or empty
*/
async function runDownloader() {
    while (download_queue.length > 0 && can_run) {
        let item = download_queue.shift();
        is_running = true;
        await processItem(item);
        saveQueue();
        saveHistory();
    }

    is_running = false;
}

/*
    Gets full local filename for the download
    Replaces wildcards in the filename with the variables
*/
function getLocalFilename(item) {
    let defaultPath = path.join(appSettings.get('downloads.directory'), path.basename(item.video.url).replace("m3u8", "ts"));
    let fullPath = null;

    if (appSettings.get('downloads.filemode') == 0) {
        fullPath = defaultPath;
    } else {
        let finalname = appSettings.get('downloads.filetemplate')
            .replace(/%%username%%/g, item.user.name)
            .replace(/%%userid%%/g, item.user.id)
            //.replace(/%%usercountry%%/g, user.country)
            .replace(/%%videoid%%/g, item.video.id)
            .replace(/%%videotitle%%/g, item.video.title ? item.video.title : 'untitled')
            .replace(/%%videotime%%/g, item.video.time);

        if (!finalname || finalname == "") {
            fullPath = defaultPath;
        } else {
            fullPath = path.join(appSettings.get('downloads.directory'), finalname.replace(/[:*?""<>|]/g, '_') + ".ts");
        }
    }

    let basename = path.basename(fullPath);

    if (basename == 'playlist.ts' || basename == 'playlist_eof.ts') {
        let parentName = path.basename(path.dirname(item.video.url));
        fullPath = fullPath.replace(basename, parentName + '.ts');
    }

    fs.ensureDirSync(path.dirname(fullPath));
    return fullPath;
}