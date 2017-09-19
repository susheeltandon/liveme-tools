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
const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron'),
    os = require('os'),
    fs = require('fs'),
    isDev = require('electron-is-dev'),
    path = require('path'),
    request = require('request'),
    appSettings = require('electron-settings'),
    Favorites = require('./custom_modules/Favorites'),
    Downloader = require('./custom_modules/Downloader');

let mainwin = null,
    queuewin = null,
    playerWindow = null,
    favoritesWindow = null,
    chatWindow = null,
    importwin = null,
    aboutwin = null;

function createWindow() {
	/*
        Load Settings
        Dupe?
	*/
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

    mainwin = new BrowserWindow({
        icon: __dirname + '/appicon.ico',
        width: 980,
        height: 560,
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
        vibrancy: 'ultra-dark',
        backgroundColor: process.platform == 'darwin' ? null : '#000000',     // We utilize the macOS Vibrancy mode
        show: false,
        webPreferences: {
            webSecurity: false,
            textAreasAreResizable: false,
            plugins: true
        }
    });

    mainwin
        .once('ready-to-show', () => {
            mainwin.show();
        })
        .on('closed', () => {
            // !! TEMPORARY !!
            app.exit(0);


            app.quit();
        })
        .loadURL(`file://${__dirname}/lmt/index.html`);

    queuewin = new BrowserWindow({
        width: 640,
        height: 400,
        resizable: true,
        minWidth: 640,
        maxWidth: 640,
        minHeight: 200,
        maxHeight: 1600,
        darkTheme: true,
        autoHideMenuBar: false,
        show: true,
        skipTaskbar: false,
        disableAutoHideCursor: true,
        titleBarStyle: 'default',
        fullscreen: false,
        minimizable: true,
        maximizable: false,
        closable: false,
        frame: true,
        vibrancy: 'ultra-dark',
        backgroundColor: process.platform == 'darwin' ? null : '#000000',     // We utilize the macOS Vibrancy mode
        webPreferences: {
            webSecurity: false,
            plugins: true,
            devTools: true
        }
    });

    queuewin
        .on('closed', () => {
            queuewin = null;
        })
        .loadURL(`file://${__dirname}/lmt/queue.html`)
        .minimize();


    /*

        !! NEED TO MOVE THIS TO ITS OWN COMMAND SOMEWHERE ELSE !!

    */
    importwin = new BrowserWindow({
        width: 320,
        height: 160,
        resizable: false,
        darkTheme: true,
        autoHideMenuBar: false,
        show: false,
        skipTaskbar: false,
        vibrancy: 'ultra-dark',
        backgroundColor: process.platform == 'darwin' ? null : '#000000',     // We utilize the macOS Vibrancy mode
        disableAutoHideCursor: true,
        titleBarStyle: 'default',
        fullscreen: false,
        maximizable: false,
        closable: true,
        frame: true,
        child: true,
        parent: mainwin
    });

    importwin
        .on('closed', () => {
            importwin = null;
        })
        .loadURL(`file://${__dirname}/lmt/importlist.html`);




    // Build our custom menubar
    Menu.setApplicationMenu(Menu.buildFromTemplate(getMenuTemplate()));

    setTimeout(function () {
        CheckForUpgrade();
    }, 10000);

    Favorites.load();
    Downloader.init(appSettings);

    Downloader.events.on('show-queue', () => {
        if (queuewin) {
            queuewin.showInactive();
        }
    });

    global.Favorites = Favorites;
    global.Downloader = Downloader;
}


var shouldQuit = app.makeSingleInstance(function (commandLine, workingDirectory) {
    if (mainwin) {
        if (mainwin.isMinimized()) {
            mainwin.restore();
        }

        mainwin.focus();
    }
});

if (shouldQuit) {
    app.quit();
    return;
}

app
    .on('ready', createWindow)
    .on('window-all-closed', () => {
        mainwin.webContent.send('do-shutdown');
        app.quit();
    })
    .on('activate', () => {
        if (mainwin === null) {
            createWindow();
        }
    });

/*
    Splash/About Window
*/
function showSplash() {
    if (aboutwin == null) {
        aboutwin = new BrowserWindow({
            width: 600,
            height: 180,
            resizable: false,
            darkTheme: true,
            autoHideMenuBar: true,
            show: false,
            skipTaskbar: true,
            disableAutoHideCursor: true,
            titleBarStyle: 'default',
            fullscreen: false,
            vibrancy: 'ultra-dark',
            backgroundColor: process.platform == 'darwin' ? null : '#000000',     // We utilize the macOS Vibrancy mode
            maximizable: false,
            frame: false,
            movable: false,
            transparent: true,
            parent: mainwin
        });

        aboutwin.once('ready-to-show', () => {
            aboutwin.show();
        })
    }

    aboutwin.loadURL(`file://${__dirname}/lmt/splash.html`);

}






/*
	Favorites Related
*/
function openFavoritesWindow() {
    if (favoritesWindow == null) {
        favoritesWindow = new BrowserWindow({
            width: 360,
            height: 720,
            resizable: false,
            darkTheme: true,
            autoHideMenuBar: false,
            show: false,
            skipTaskbar: false,
            vibrancy: 'ultra-dark',
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

        favoritesWindow
            .once('ready-to-show', () => {
                favoritesWindow.show();
            })
            .on('closed', () => {
                favoritesWindow = null;
            })
            .loadURL(`file://${__dirname}/lmt/favorites-list.html`);
    }
};

/*
	Import Window
*/
ipcMain.on('show-import-win', (event, arg) => {
    importwin.show();
    importwin.webContents.send('import-list', { list: arg.list });
});

ipcMain.on('hide-import-win', () => {
    importwin.hide();
});

/*
	Settings Related
*/
ipcMain.on('show-settings', () => {
    let settingsWindow = new BrowserWindow({
        width: 900,
        height: 432,
        resizable: false,
        darkTheme: true,
        autoHideMenuBar: false,
        show: false,
        skipTaskbar: false,
        center: true,
        vibrancy: 'ultra-dark',
        backgroundColor: process.platform == 'darwin' ? null : '#000000',     // We utilize the macOS Vibrancy mode
        disableAutoHideCursor: true,
        titleBarStyle: 'default',
        fullscreen: false,
        maximizable: false,
        closable: true,
        frame: true,
        parent: mainwin,
        modal: true
    });

    settingsWindow
        .once('ready-to-show', () => {
            settingsWindow.show();
        })
        .loadURL(`file://${__dirname}/lmt/settings.html`);
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

    win.once('ready-to-show', () => {
        win.show();
    }).loadURL(`file://${__dirname}/lmt/` + arg.url);
});

/*
	Video Player Related
*/
ipcMain.on('play-video', (event, arg) => {
    if (playerWindow == null) {
        playerWindow = new BrowserWindow({
            width: 368,
            height: 640,
            minWidth: 184,
            minHeight: 320,
            resizable: true,
            darkTheme: true,
            autoHideMenuBar: true,
            show: false,
            skipTaskbar: false,
            vibrancy: 'ultra-dark',
            backgroundColor: process.platform == 'darwin' ? null : '#000000',     // We utilize the macOS Vibrancy mode
            disableAutoHideCursor: true,
            titleBarStyle: 'default',
            fullscreen: false,
            maximizable: false,
            closable: true,
            frame: true
        });

        playerWindow
            .once('ready-to-show', () => {
                playerWindow.show();
            })
            .on('closed', () => {
                playerWindow = null;
            });
    }

    playerWindow.loadURL(`file://${__dirname}/lmt/player.html#` + arg.url);
});

/* 
	Chat Window 
*/
ipcMain.on('open-chat', (event, arg) => {
    chatWindow = new BrowserWindow({
        width: 320,
        height: 480,
        minWidth: 320,
        maxWidth: 320,
        minHeight: 240,
        maxHeight: 1600,
        resizable: true,
        darkTheme: true,
        autoHideMenuBar: false,
        show: false,
        skipTaskbar: false,
        vibrancy: 'ultra-dark',
        backgroundColor: process.platform == 'darwin' ? null : '#000000',     // We utilize the macOS Vibrancy mode
        disableAutoHideCursor: true,
        titleBarStyle: 'default',
        fullscreen: false,
        minimizable: false,
        maximizable: false,
        closable: true,
        frame: true
    });

    chatWindow
        .on('closed', () => {
            chatWindow = null;
        })
        .loadURL(`file://${__dirname}/lmt/chat.html`);

    chatWindow.showInactive();
    chatWindow.once('ready-to-show', () => {
        chatWindow.webContents.send('set-chat', { url: arg.url, startTime: arg.startTime, nickname: arg.nickname });    
    });    
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
                },
                { type: 'separator' },
                {
                    label: 'Toggle Queue Window',
                    click: () => toggleQueueWindow()
                },
                {
                    label: 'Open Favorites Window',
                    click: () => openFavoritesWindow()
                }
            ]
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'LiveMe Tools Github Page',
                    click: () => shell.openExternal('https://github.com/thecoder75/liveme-tools/')
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
            label: app.getName(),
            submenu: [
                {
                    label: 'About ' + app.getName(),
                    click: () => showSplash()  
                },
                { type: 'separator' },
                { role: 'services', submenu: [] },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        });
    }

    // Add "File > Quit" menu item so Linux distros where the system tray icon is
    // missing will have a way to quit the app.
    if (process.platform === 'linux') {
        // File menu (Linux)
        template[0].submenu.push({
            label: 'Quit',
            click: () => app.quit()
        })
    }

    return template
}


function CheckForUpgrade() {
    var r = new Date().getTime();

    request({ url: 'https://raw.githubusercontent.com/thecoder75/liveme-tools/master/src/package.json?random=' + r, timeout: 15000 }, function (err, response, body) {
        var js = JSON.parse(body), nv = parseFloat(js.minversion.replace('.', '')), ov = parseFloat(app.getVersion().replace('.', '')), isCurrent = nv > ov;

        if (nv > ov) {
            let win = new BrowserWindow({
                width: 400,
                height: 244,
                resizable: false,
                darkTheme: true,
                autoHideMenuBar: false,
                skipTaskbar: false,
                backgroundColor: '#4a4d4e',
                disableAutoHideCursor: true,
                titleBarStyle: 'default',
                fullscreen: false,
                maximizable: false,
                closable: true,
                frame: true,
                show: false
            });

            win.once('ready-to-show', () => {
                win.show();
            }).loadURL(`file://${__dirname}/lmt/upgrade.html`);
        }
    });
}


