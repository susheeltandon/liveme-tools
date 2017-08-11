/*
	Downloads Module
*/

const appSettings = require('electron').remote.require('electron-settings'), path = require('path');
var download_queue = [], download_history = [], can_run = false, is_running = false;

module.exports = {
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
    add: function(User, Video) {
        download_queue.push({ user: User, video: Video });
    },
    
    /*
        Starts/Resumes downloading
    */
    start: function() {
        if (download_queue.length > 0) {
            can_run = true;
        }

        if (!is_running && can_run) {
            runDownloader();
        }
    },

    /*
        Stops downloading any new files after the one(s) it's downloading now, until told to start again
    */
    stop: function() {
        can_run = false;
    },

    /*
        Called on startup
    */
    init: function() {
        loadQueue();
        loadHistory();
    },

    is_running: function() {
        return is_running;
    },

    is_paused: function() {
        return !can_run; // If it can't run, it is paused
    },

    /* 
        TODO: Look up what Electron ships with support for; I don't want to add too many dependencies
        Observable or something to subscribe to be notified about status of downloads, for the downloads page
    */
    subscribe_to_progress: function() {

    }
};

function loadQueue() {

}

function saveQueue() {

}

function loadHistory() {

}

function saveHistory() {

}

/*
    Pop an item from the queue and process it here
*/
function processItem(item) {

}

/*
    Starts processing the download queue until it's paused or empty
*/
function runDownloader() {
    while (download_queue.length > 0 && can_run) {
        let item = download_queue.unshift();
        processItem(item);
    }
}

/*
    Replaces wildcards in the filename with the variables
*/
function parseFilename(user, video) {
    let setting = appSettings.get('downloads.filemode');

    if (setting == 'playlist-filename') {
        return path.basename(video.url).replace("m3u8", "ts");
    } else {
        let finalname = setting.replace("%username%", user.name)
                               .replace("%userid%", user.id)
                               //.replace("%usercountry%", user.country)
                               .replace("%videoid%", video.id)
                               .replace("%videotitle%", video.title)
                               .replace("%videotime%", video.time);

        if (!finalname || finalname == "") {
            return path.basename(video.url).replace("m3u8", "ts");
        } else {
            return finalname + ".ts";
        }
    }
}