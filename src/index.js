/*

	  _      _           __  __        _______          _
	 | |    (_)         |  \/  |      |__   __|        | |
	 | |     ___   _____| \  / | ___     | | ___   ___ | |___
	 | |    | \ \ / / _ \ |\/| |/ _ \    | |/ _ \ / _ \| / __|
	 | |____| |\ V /  __/ |  | |  __/    | | (_) | (_) | \__ \
	 |______|_| \_/ \___|_|  |_|\___|    |_|\___/ \___/|_|___/


		 			Licensed under GPL3 now

	Developers:

	thecoder		- https://github.com/thecoder75
	polydragon		- https://github.com/polydragon

*/
const { app, BrowserWindow, ipcMain, Menu, shell, dialog } = require('electron'),
    os = require('os'),
    fs = require('fs'),
    isDev = require('electron-is-dev'),
    path = require('path'),
    request = require('request'),
    appSettings = require('electron-settings'),
    Favorites = require('./custom_modules/Favorites'),
    DownloadManager = new (require('./custom_modules/DownloadManager').DownloadManager)(),
    LiveMe = require('liveme-api');

let mainwin = null,
    queuewin = null,
    playerWindow = null,
    favoritesWindow = null,
    chatWindow = null,
    importwin = null,
    aboutwin = null,
    updatewin = null,
    livemeomg = null;

function startApplication() {
    if (!appSettings.get('downloads.directory')) {
        appSettings.set('downloads', {
            directory: path.join(app.getPath('home'), 'Downloads'),
            filemode: 0,
            filetemplate: '',
            history: true,
            replaycount: 10,
            engine: 'internal'
        });
    }

    var mainpos = { x: -1, y: -1 }, queuepos = { x: -1, y: -1 }, mainsize = [980, 540], queuesize = [640, 400];

    if (!appSettings.get('windowpos.main')) {
        appSettings.set('windowpos', {
            main: JSON.stringify([ -1, -1]),
            queue: JSON.stringify([ -1, -1]),
            player: JSON.stringify([ -1, -1]),
            favorites: JSON.stringify([ -1, -1]),
            messages: JSON.stringify([ -1, -1])
        });
        appSettings.set('windowsize', {
            main: JSON.stringify([ 980, 560]),
            queue: JSON.stringify([ 640, 400]),
            player: JSON.stringify([ 368, process.platform == 'darwin' ? 640 : 664]),
            favorites: JSON.stringify([ 360, 720]),
            messages: JSON.stringify([ 360, 480])
        });
    } else {
        mainpos = JSON.parse(appSettings.get('windowpos.main'));
        queuepos = JSON.parse(appSettings.get('windowpos.queue'));
        mainsize = JSON.parse(appSettings.get('windowsize.main'));
        queuesize = JSON.parse(appSettings.get('windowsize.queue'));
    }


    mainwin = new BrowserWindow({
        icon: __dirname + '/appicon.ico',
        x: mainpos[0] != -1 ? mainpos[0] : null,
        y: mainpos[1] != -1 ? mainpos[1] : null,
        width: mainsize[0],
        height: mainsize[1],
        minWidth: 980,
        minHeight: 560,
        darkTheme: true,
        autoHideMenuBar: false,
        disableAutoHideCursor: true,
        titleBarStyle: 'default',
        fullscreen: false,
        maximizable: true,
        closable: true,
        frame: true,
        vibrancy: 'dark',
        backgroundColor: process.platform == 'darwin' ? null : '#000000',     // We utilize the macOS Vibrancy mode
        show: false,
        webPreferences: {
            webSecurity: false,
            textAreasAreResizable: false,
            plugins: true
        }
    });

    mainwin
        .on('ready-to-show', () => {
            // mainwin.show();
        });

    mainwin.on('close', () => {
        appSettings.set('windowpos.main', JSON.stringify(mainwin.getPosition()) );
        appSettings.set('windowsize.main', JSON.stringify(mainwin.getSize()) );
    });
    mainwin.on('closed', () => {
        shutdownApp();
    });

    mainwin.loadURL(`file://${__dirname}/lmt/index.html`);

    queuewin = new BrowserWindow({
        x: queuepos[0] != -1 ? queuepos[0] : null,
        y: queuepos[1] != -1 ? queuepos[1] : null,
        width: queuesize[0],
        height: queuesize[1],
        resizable: true,
        minWidth: 640,
        maxWidth: 640,
        minHeight: 200,
        maxHeight: 1600,
        darkTheme: true,
        autoHideMenuBar: true,
        show: false,
        skipTaskbar: false,
        disableAutoHideCursor: true,
        titleBarStyle: 'default',
        fullscreen: false,
        minimizable: true,
        maximizable: false,
        closable: false,
        frame: true,
        vibrancy: 'dark',
        backgroundColor: process.platform == 'darwin' ? null : '#000000',     // We utilize the macOS Vibrancy mode
        webPreferences: {
            webSecurity: false,
            plugins: true,
            devTools: true
        }
    });

    queuewin.setMenu(null);
    queuewin
        .on('closed', () => {
            queuewin = null;
        })
        .loadURL(`file://${__dirname}/lmt/queue.html`);
    queuewin.on('close', () => {
        appSettings.set('windowpos.queue', JSON.stringify(queuewin.getPosition()) );
        appSettings.set('windowsize.queue', JSON.stringify(queuewin.getSize()) );
    });


    updatewin = new BrowserWindow({
        width: 480,
        height: 80,
        resizable: false,
        darkTheme: true,
        autoHideMenuBar: true,
        show: false,
        skipTaskbar: true,
        disableAutoHideCursor: true,
        titleBarStyle: 'default',
        fullscreen: false,
        minimizable: false,
        maximizable: false,
        closable: true,
        frame: false,
        vibrancy: 'dark',
        backgroundColor: '#000000',
        webPreferences: {
            webSecurity: false,
            plugins: true,
            devTools: true
        }
    });
    updatewin.setMenu(null);
    updatewin
        .on('closed', () => {
            updatewin = null;
        })
        .loadURL(`file://${__dirname}/lmt/update.html`);



    // Build our custom menubar
    Menu.setApplicationMenu(Menu.buildFromTemplate(getMenuTemplate()));

    setTimeout(function () {
        CheckForUpgrade();
    }, 10000);

    setTimeout(function() {
        queuewin.minimize();
    }, 50);

    setTimeout(() => {
        showSplash();
    }, 500);

    Favorites.load();
    DownloadManager.init(appSettings);
    global.Favorites = Favorites;
    global.DownloadManager = DownloadManager;

    DownloadManager.events.on('show-queue', () => {
        if (queuewin) {
            queuewin.showInactive();
        }
    });


    // Temporary:
    setTimeout(function(){
        aboutwin.on('close', () => {
            mainwin.show();
        });
    }, 1500);

    /*



        When the changeover is made to use a database type file vs the current file structure,
        then this code will be executed to launch the update windoow which will handle all
        the data conversions and cleanup.



    setTimeout(function() {
        if (fs.existsSync(path.join(app.getPath('appData'), app.getName(), 'livemetools_db'))) {
            aboutwin.on('close', () => {
                mainwin.show();
            });
        } else {
            aboutwin.on('close', () => {
                updatewin.show();
            });
            updatewin.on('close', () => {
                setTimeout(function(){
                    mainwin.show();
                }, 500);

            });
        }
    }, 1500);
    */

}

var shouldQuit = app.makeSingleInstance(function (commandLine, workingDirectory) {
});

if (shouldQuit) {
    shutdownApp();
    return;
}

app
    .on('ready', startApplication)
    .on('activate', () => {
        if (mainwin === null) {
            startApplication();
        }
    });



/*
    Splash/About Window
*/
function showSplash() {
    aboutwin = new BrowserWindow({
        width: 640,
        height: 224,
        resizable: false,
        darkTheme: true,
        autoHideMenuBar: true,
        show: false,
        skipTaskbar: true,
        disableAutoHideCursor: true,
        titleBarStyle: 'default',
        fullscreen: false,
        vibrancy: 'dark',
        backgroundColor: process.platform == 'darwin' ? null : '#000000',     // We utilize the macOS Vibrancy mode
        maximizable: false,
        frame: false,
        movable: false,
        transparent: true,
        parent: mainwin
    });
    aboutwin.setMenu(null);
    aboutwin
        .on('ready-to-show', () => {
            aboutwin.show();
        })
        .loadURL(`file://${__dirname}/lmt/splash.html`);

}

function showSettings() {
    let settingsWindow = new BrowserWindow({
        width: 900,
        height: 400,
        resizable: false,
        darkTheme: true,
        autoHideMenuBar: true,
        show: false,
        skipTaskbar: false,
        center: true,
        vibrancy: 'dark',
        backgroundColor: process.platform == 'darwin' ? null : '#000000',     // We utilize the macOS Vibrancy mode
        disableAutoHideCursor: true,
        titleBarStyle: 'default',
        fullscreen: false,
        maximizable: false,
        closable: true,
        frame: true,
        parent: mainwin,
        modal: false
    });

    settingsWindow.setMenu(null);

    settingsWindow
        .on('ready-to-show', () => {
            settingsWindow.show();
        })
        .loadURL(`file://${__dirname}/lmt/settings.html`);
};


function showLiveMeOMG() {
    let livemeomg = new BrowserWindow({
        width: 640,
        height: 540,
        resizable: true,
        darkTheme: true,
        autoHideMenuBar: true,
        show: false,
        skipTaskbar: false,
        center: true,
        vibrancy: 'dark',
        backgroundColor: process.platform == 'darwin' ? null : '#000000',     // We utilize the macOS Vibrancy mode
        disableAutoHideCursor: true,
        titleBarStyle: 'default',
        fullscreen: false,
        maximizable: true,
        closable: true,
        frame: true,
        modal: false
    });

    livemeomg.setMenu(null);

    livemeomg
        .on('ready-to-show', () => {
            livemeomg.show();
        })
        .loadURL(`file://${__dirname}/lmt/livemeomg.html`);
};











/*
	Favorites Related
*/
function openFavoritesWindow() {
    if (favoritesWindow == null) {

        var favpos = JSON.parse(appSettings.get('windowpos.favorites')),
            favsize = JSON.parse(appSettings.get('windowsize.favorites'));

        favoritesWindow = new BrowserWindow({
            x: favpos[0] != -1 ? favpos[0] : null,
            y: favpos[1] != -1 ? favpos[1] : null,
            width: favsize[0],
            height: favsize[1],
            resizable: false,
            darkTheme: true,
            autoHideMenuBar: true,
            show: false,
            skipTaskbar: false,
            vibrancy: 'dark',
            backgroundColor: process.platform == 'darwin' ? null : '#000000',     // We utilize the macOS Vibrancy mode
            disableAutoHideCursor: true,
            titleBarStyle: 'default',
            fullscreen: false,
            maximizable: false,
            closable: true,
            frame: true,
            webPreferences: {
                webSecurity: false,
                plugins: true,
                devTools: true
            }
        });
        favoritesWindow.setMenu(null);
        favoritesWindow
            .on('ready-to-show', () => {
                favoritesWindow.show();
            })
            .on('closed', () => {
                favoritesWindow = null;
            })
            .on('close', () => {
                appSettings.set('windowpos.favorites', JSON.stringify(favoritesWindow.getPosition()) );
                appSettings.set('windowsize.favorites', JSON.stringify(favoritesWindow.getSize()) );
            })
            .loadURL(`file://${__dirname}/lmt/favorites-list.html`);

    }
};

ipcMain.on('show-settings', (event, arg) => {
    showSettings();
});



/*
    Search Related
    ?? - Called from Following/Fans/Favorites windows when an entry is clicked.  Will
    need to clean up and standardize as a single command
*/

ipcMain.on('submit-search', (event, arg) => {
    mainwin.webContents.send('do-search', { userid: arg.userid });
});

ipcMain.on('livemesearch', (event, arg) => {
    if (arg.type == 'search') {
        lmt.searchkeyword(arg.query, function (e) {
            mainwin.webContents.send('render_results', { data: e, type: 'search' });
        })
    } else {
        lmt.getuservideos(arg.query, function (e) {
            mainwin.webContents.send('render_results', { data: e, type: 'userlookup' });
        })
    }
});



/*
	Popup Windows (Followings/Fans)
*/
ipcMain.on('open-window', (event, arg) => {

    let win = new BrowserWindow({
        width: 320,
        height: 720,
        resizable: false,
        darkTheme: true,
        autoHideMenuBar: false,
        skipTaskbar: false,
        vibrancy: 'dark',
        backgroundColor: process.platform == 'darwin' ? null : '#000000',     // We utilize the macOS Vibrancy mode
        disableAutoHideCursor: true,
        titleBarStyle: 'default',
        fullscreen: false,
        maximizable: false,
        closable: true,
        frame: true,
        show: false
    });
    win.setMenu(null);

    win.on('ready-to-show', () => {
        win.show();
    }).loadURL(`file://${__dirname}/lmt/` + arg.url);
});



/*
	Video Player Related

    macOS allows us to still have window controls but no titlebar
    and overlay the controls on the content of the page.

    This allows us to have a window just like QuickTime Player
    does.
*/
ipcMain.on('play-video', (event, arg) => {
    if (playerWindow == null) {

        var playerpos = JSON.parse(appSettings.get('windowpos.player')),
            playersize = JSON.parse(appSettings.get('windowsize.player'));

        playerWindow = new BrowserWindow({
            x: playerpos[0] != -1 ? playerpos[0] : null,
            y: playerpos[1] != -1 ? playerpos[1] : null,
            width: playersize[0],
            height: playersize[1],
            minWidth: 368,
            minHeight: process.platform == 'darwin' ?  640 : 664,
            resizable: true,
            darkTheme: true,
            autoHideMenuBar: false,
            show: false,
            skipTaskbar: false,
            backgroundColor: '#000000',
            disableAutoHideCursor: true,
            titleBarStyle: 'hidden',
            fullscreen: false,
            maximizable: true,
            closable: true,
            frame: process.platform == 'darwin' ? false : true
        });
        playerWindow.setMenu(null);

        /*
        if (process.platform == 'darwin') {
            playerWindow.setAspectRatio(9 / 16);
        }
        */

        playerWindow
            .on('ready-to-show', () => {
                playerWindow.show();
            })
            .on('close', () => {
                appSettings.set('windowpos.player', JSON.stringify(playerWindow.getPosition()) );
                appSettings.set('windowsize.player', JSON.stringify(playerWindow.getSize()) );
            })
            .on('closed', () => {
                playerWindow = null;
            });
    }

    playerWindow.loadURL(`file://${__dirname}/lmt/player.html#` + arg.url);
});
ipcMain.on('video-set-time', (event, arg) => {
    playerWindow.webContents.send('jump-to-time', { time: arg.time, label: arg.label });
});

/*
	Chat Window
*/
ipcMain.on('open-chat', (event, arg) => {

    var msgpos = JSON.parse(appSettings.get('windowpos.messages')),
        msgsize = JSON.parse(appSettings.get('windowsize.messages'));


    chatWindow = new BrowserWindow({
        x: msgpos[0] != -1 ? msgpos[0] : null,
        y: msgpos[1] != -1 ? msgpos[1] : null,
        width: msgsize[0],
        height: msgsize[1],
        width: 360,
        height: 480,
        minWidth: 360,
        maxWidth: 360,
        minHeight: 240,
        maxHeight: 1600,
        resizable: true,
        darkTheme: true,
        autoHideMenuBar: false,
        show: false,
        skipTaskbar: false,
        vibrancy: 'dark',
        backgroundColor: process.platform == 'darwin' ? null : '#000000',     // We utilize the macOS Vibrancy mode
        disableAutoHideCursor: true,
        titleBarStyle: 'default',
        fullscreen: false,
        minimizable: false,
        maximizable: false,
        closable: true,
        frame: true
    });
    chatWindow.setMenu(null);

    chatWindow
        .on('close', () => {
            appSettings.set('windowpos.messages', JSON.stringify(chatWindow.getPosition()) );
            appSettings.set('windowsize.messages', JSON.stringify(chatWindow.getSize()) );
        })
        .on('closed', () => {
            chatWindow = null;
        })
        .loadURL(`file://${__dirname}/lmt/chat.html?${arg.videoid}`);

    chatWindow.showInactive();
});



/*

    Queue Window

	show-queue is issued when only the first download is added to the queue
*/
ipcMain.on('show-queue', () => {
    if (queuewin.isMinimized()) {
        queuewin.restore();
    }
});
function toggleQueueWindow() {
    if (queuewin.isMinimized()) {
        queuewin.restore();
    } else {
        queuewin.minimize();
    }
};



/*
	History Window

*/

ipcMain.on('history-delete', (event, arg) => {
    mainwin.send('history-delete', {});
});




/*

    Misc. Functions

    Here are the Import and Export functions and other functions we
    use.

*/
function importUrlList() {
    var d = dialog.showOpenDialog(
        {
            properties: [
                'openFile',
            ],
            buttonLabel : 'Import',
            filters : [
                { name : 'Plain Text File', extensions: [ 'txt' ]}
            ]
        },
        (filePaths) => {
            if (filePaths == null) return;
            // We have a selection...
            mainwin.send('show-status', { message : 'Importing file, please wait...' });
            fs.readFile(filePaths[0], 'utf8', function (err,data) {
                if (err) {
                    mainwin.send('update-status', { message : 'Import error while accessing the file.' });
                    setTimeout(function(){
                        mainwin.send('hide-status');
                    }, 2000);
                } else {
                    var filelist = data.split('\n');

                    for (i = 0; i < filelist.length; i++)  {
                        if (filelist[i].indexOf('http') > -1) {
                            Downloads.add({
                                user: {
                                    id: null,
                                    name: null
                                },
                                video: {
                                    id: null,
                                    title: null,
                                    time: 0,
                                    url: filelist[i].trim()
                                }
                            });

                        }
                    }
                }
            });
        }
    );}

function importVideoIdList() {
    var d = dialog.showOpenDialog(
        {
            properties: [
                'openFile',
            ],
            buttonLabel : 'Import',
            filters : [
                { name : 'Plain Text File', extensions: [ 'txt' ]}
            ]
        },
        (filePaths) => {
            // We have a selection...
            if (filePaths == null) return;
            mainwin.send('show-status', { message : 'Importing file, please wait...' });

            fs.readFile(filePaths[0], 'utf8', function (err,data) {
                if (err) {
                    mainwin.send('update-status', { message : 'Import error while accessing the file.' });
                    setTimeout(function(){
                        mainwin.send('hide-status');
                    }, 2500);
                } else {
                    var tt = data.replace('\r', '');
                    var t = tt.split('\n'), i = 0, idlist = [];

                    for (i = 0; i < t.length; i++) {
                        if (t[i].length > 16)
                            idlist.push(t[i].trim());
                    }

                    mainwin.send('update-status', { message : 'Found '+idlist.length+' entries to import.' });
                    _importVideoIdList(idlist);

                    setTimeout(function(){
                        mainwin.send('hide-status');
                    }, 2500);
                }
            });
        }
    );
}

function _importVideoIdList(list) {
    var entry = list.shift();
    LiveMe.getVideoInfo(entry)
        .then(video => {

            if (video.vid.length > 16) {
                DownloadManager.add({
                    user: {
                        id: video.userid,
                        name: video.uname
                    },
                    video: {
                        id: video.vid,
                        title: video.title,
                        time: video.vtime,
                        url: video.hlsvideosource
                    }
                });
            }

            if (list.length > 0)
                _importVideoIdList(list);
            else {
                mainwin.send('update-status', { message : 'Import complete.' });
                setTimeout(function(){
                    mainwin.send('hide-status');
                }, 1000);
            }
        })
        .catch(err => {
            console.log(`getVideoInfo() failed, ${err}`);
            return_code = 1;
        });
}

function exportFavorites() {
    let d = dialog.showSaveDialog(
        {
            filters: [ { name: "Text File", extensions: ["txt"] }, { name: 'All Files', extensions: ['*'] } ],
            defaultPath: 'Exported Favorites UserID List.txt'
        },
        (filePath) => {

            if (filePath != null)
                Favorites.export(filePath);
        }
    );
}

function importFavorites() {
    let d = dialog.showOpenDialog(
        {
            filters: [ { name: "Text File", extensions: ["txt"] }, { name: 'All Files', extensions: ['*'] } ],
            defaultPath: 'Exported Favorites UserID List.txt'
        },
        (filePath) => {
            if (filePath != null)
                Favorites.import(filePath[0]);
        }
    );
}

function shutdownApp() {
    if (queuewin != null) {
        queuewin.setClosable(true);
        queuewin.close();
    }

    if (updatewin != null) {
        updatewin.setClosable(true);
        updatewin.close();
    }

    Favorites.forceSave();
    DownloadManager.save();
    //Downloader.killActiveDownload();

    setTimeout(function(){
        app.quit();
    }, 500);
}














/*

    Main Window/macOS Menubar menu template

*/
function getMenuTemplate() {
    var template = [
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'delete' },
                { role: 'selectall' }
            ]
        },
        {
            label : 'Favorites',
            submenu : [
                {
                    label: 'Open Favorites',
                    accelerator: 'CommandOrControl+D',
                    click: () => openFavoritesWindow()
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Refresh Entries',
                    click: () => Favorites.update()
                },
                {
                    label: 'Export Favorites List',
                    click: () => exportFavorites()
                },
                {
                    label: 'Import Favorites List',
                    click: () => importFavorites()
                }
            ]
        },
        {
            role: 'window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' },
                { type: 'separator' },
                {
                    label: 'Developer Tools',
                    submenu: [
                        { role: 'reload' },
                        { role: 'forcereload' },
                        { role: 'toggledevtools' }
                    ]
                }
            ]
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'LiveMe Tools Page',
                    click: () => shell.openExternal('https://thecoder75.github.io/liveme-tools/')
                },
                {
                    label: 'Help with FFMPEG Installation',
                    click: () => shell.openExternal('https://github.com/thecoder75/liveme-tools/blob/master/docs/ffmpeg.md')
                },
                {
                    label: 'Report an Issue',
                    click: () => shell.openExternal('https://github.com/thecoder75/liveme-tools/issues')
                }
            ]
        }
    ];

    if (process.platform === 'darwin') {
        template.unshift({
            label: 'File',
            submenu: [
                {
                    label: 'Import',
                    submenu : [
                        {
                            label: 'Import URL List',
                            accelerator: 'CommandOrControl+I',
                            click: () => importUrlList()
                        },
                        {
                            label: 'Import VideoID List',
                            accelerator: 'CommandOrControl+Shift+I',
                            click: () => importVideoIdList()
                        }
                    ]
                },
                { type: 'separator' },
                {
                    label: 'Show LiveMe-OMG',
                    click: () => showLiveMeOMG()
                }
            ]
        });
        template.unshift({
            label: app.getName(),
            submenu: [
                {
                    label: 'About ' + app.getName(),
                    click: () => showSplash()
                },
                { type: 'separator' },
                {
                    label : 'Preferences',
                    accelerator: 'CommandOrControl+,',
                    click: () => showSettings()
                },
                { type: 'separator' },
                { role: 'services', submenu: [] },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                {
                    label: 'Quit ' + app.getName(),
                    accelerator: 'CommandOrControl+Q',
                    click: () => shutdownApp()
                }
            ]
        });
    } else {
        template.unshift({
            label: 'File',
            submenu: [
                {
                    label: 'Import',
                    submenu : [
                        {
                            label: 'Import URL List',
                            accelerator: 'CommandOrControl+I',
                            click: () => importUrlList()
                        },
                        {
                            label: 'Import VideoID List',
                            accelerator: 'CommandOrControl+Shift+I',
                            click: () => importVideoIdList()
                        }
                    ]
                },
                { type: 'separator' },
                {
                    label: 'Show LiveMe-OMG',
                    click: () => showLiveMeOMG()
                },
                { type: 'separator' },
                {
                    label : 'Preferences',
                    click: () => showSettings()
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: 'CommandOrControl+F4',
                    click: () => shutdownApp()
                }
            ]
        });
    }

    return template;
}


function CheckForUpgrade() {
    var r = new Date().getTime();

    request({ url: 'https://raw.githubusercontent.com/thecoder75/liveme-tools/master/src/package.json?random=' + r, timeout: 15000 }, function (err, response, body) {
        var js = JSON.parse(body), nv = parseFloat(js.minversion.replace('.', '')), ov = parseFloat(app.getVersion().replace('.', '')), isCurrent = nv > ov;

        if (nv > ov) {
            let win = new BrowserWindow({
                width: 480,
                height: 280,
                resizable: false,
                darkTheme: true,
                autoHideMenuBar: false,
                skipTaskbar: false,
                vibrancy: 'ultra-dark',
                backgroundColor: process.platform == 'darwin' ? null : '#000000',     // We utilize the macOS Vibrancy mode
                disableAutoHideCursor: true,
                titleBarStyle: 'default',
                fullscreen: false,
                maximizable: false,
                closable: true,
                frame: true,
                show: false
            });

            win.on('ready-to-show', () => {
                win.show();
            }).loadURL(`file://${__dirname}/lmt/upgrade.html`);
        }
    });
}
