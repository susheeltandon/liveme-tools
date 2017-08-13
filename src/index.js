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
const 	{app, BrowserWindow, ipcMain, Menu} = require('electron'), os = require('os'), 
		fs = require('fs'), isDev = require('electron-is-dev'), path = require('path');
		

let 	mainwin, queuewin, playerWindow, settingsWindow, favoritesWindow, chatWindow, 
		splashWindow, menu, appSettings = require('electron-settings');

function createWindow(){
	/*
		Load Settings
	*/
	if (!appSettings.get('downloads.directory')) {
		appSettings.set('downloads', {
			directory : path.join(remote.app.getPath('home'), 'Downloads'),
			filemode: 0,
			filetemplate: '',
			history: true,
			engine: 'internal'
		});

	}

	/*
		Create Windows
	*/
	mainwin=new BrowserWindow({
		icon: __dirname + '/appicon.ico', width:980, height:600, minWidth:980, minHeight:600, darkTheme:true, autoHideMenuBar:false,
		disableAutoHideCursor:true, titleBarStyle: 'default', fullscreen:false, maximizable:false, frame:false, vibrancy:'dark', 
		webPreferences:{ webSecurity:false, textAreasAreResizable:false, plugins:true }
	});

	queuewin=new BrowserWindow({
		width: 640, height: 280, resizable:false, darkTheme:true, autoHideMenuBar:false, show: false, skipTaskbar: false,
		disableAutoHideCursor:true, titleBarStyle: 'default', fullscreen:false, maximizable:false, frame:false, 
		webPreferences:{ webSecurity:false, plugins:true, devTools:true }
	});

	splashWindow=new BrowserWindow({
		width: 480, height: 212, resizable:false, darkTheme:true, autoHideMenuBar:false, show: true, skipTaskbar: false,
		disableAutoHideCursor:true, titleBarStyle: 'default', fullscreen:false, maximizable:false, frame:false, movable: false,
		parent: mainwin, child: true, webPreferences:{ webSecurity:false, plugins:false, devTools:false }
	});

	mainwin.loadURL(`file://${__dirname}/lmt/index.html`);
	mainwin.on('closed', () => { 
		mainwin = null; 
		queuewin.close();
		app.quit();
	});

	queuewin.loadURL(`file://${__dirname}/lmt/queue.html`);
	queuewin.on('closed', () => { 
		queuewin = null; 
	});

	splashWindow.loadURL(`file://${__dirname}/lmt/splash.html`);
	splashWindow.on('closed', () => { 
		splashWindow = null; 
	});

	chatWindow = new BrowserWindow({
		width: 320, height: 760, resizable: true, darkTheme:true, autoHideMenuBar:false, show:false, skipTaskbar: false,
		disableAutoHideCursor:true, titleBarStyle: 'default', fullscreen:false, maximizable:false, frame:false
	});
	chatWindow.on('closed', () => { 
		chatWindow = null; 
	});
	chatWindow.loadURL(`file://${__dirname}/lmt/chat.html`);

	/*
		Only use custom menus if app is compiled, otherwise leave menus alone during development testing.
	*/
	if (isDev == false) {
		menu = Menu.buildFromTemplate(getMenuTemplate())
		Menu.setApplicationMenu(menu)
	}

}


var shouldQuit = app.makeSingleInstance(function(commandLine,workingDirectory){
	if (mainwin) {
		if (mainwin.isMinimized())
			mainwin.restore();

		mainwin.focus();
	}
});
if (shouldQuit) {
	app.quit();
	return;
}

app.on('ready', createWindow)
app.on('window-all-closed', () => { 
	mainwin.webContents.send('do-shutdown');
	app.quit();
});
app.on('activate', () => { if (mainwin === null) { createWindow(); } });







/*
	Favorites Related
*/
ipcMain.on('show-favorites', () => {
	favoritesWindow = new BrowserWindow({
		width:320, height:720, resizable:false, darkTheme:true, autoHideMenuBar:false, show: true, skipTaskbar: false,
		disableAutoHideCursor:true, titleBarStyle: 'default', fullscreen:false, maximizable:false, frame:false, 
		webPreferences:{ webSecurity:false, plugins:true, devTools:true }
	});
	favoritesWindow.loadURL(`file://${__dirname}/lmt/favorites-list.html`);
	favoritesWindow.on('closed', () => { 
		favoritesWindow = null; 
	});
	favoritesWindow.show();
});

ipcMain.on('favorites-refresh', (event, arg) => {
	if (typeof(favoritesWindow) == 'undefined') return;
	favoritesWindow.send('favorites-refresh');
});








/*
	Settings Related
*/
ipcMain.on('show-settings', () => {
	var settingsWindow = new BrowserWindow({
		width: 900, height: 360, resizable:false, darkTheme:true, autoHideMenuBar:false, show: true, skipTaskbar: false, center: true,
		disableAutoHideCursor:true, titleBarStyle: 'default', fullscreen:false, maximizable:false, frame:false, 
		parent: mainwin, modal: false, webPreferences:{ webSecurity:false, plugins:true, devTools:true }
	});
	settingsWindow.loadURL(`file://${__dirname}/lmt/settings.html`);
	settingsWindow.on('closed', () => { 
		settingsWindow = null; 
	});
	settingsWindow.show();

});







/*
	Search Related
*/

ipcMain.on('submit-search', (event, arg) => { mainwin.webContents.send('do-search', { userid: arg.userid }); });

ipcMain.on('livemesearch', (event, arg) => { 
	if (arg.type == 'search') {
		lmt.searchkeyword(arg.query, function(e){
			mainwin.webContents.send('render_results', { data: e, type: 'search' }); 			
		})
	} else {
		lmt.getuservideos(arg.query, function(e){
			mainwin.webContents.send('render_results', { data: e, type: 'userlookup' }); 			
		})
	}
});








/*
	Queue Related
*/
ipcMain.on('download-video', (event, arg) => {
	if (queuewin.isVisible() == false) { queuewin.showInactive(); }
	queuewin.webContents.send('add-to-queue', arg);
});
ipcMain.on('show-queue', () => { queuewin.show(); });
ipcMain.on('hide-queue', () => { queuewin.hide(); });









/*
	Popup Windows (Followings/Fans)
*/
ipcMain.on('open-window', (event, arg) => {
	var win = new BrowserWindow({
		width: 320, height: 720, resizable:false, darkTheme:true, autoHideMenuBar:false, skipTaskbar: false,
		disableAutoHideCursor:true, titleBarStyle: 'default', fullscreen:false, maximizable:false, frame:false
	});
	win.setMenu(null);
	win.loadURL(`file://${__dirname}/lmt/`+arg.url);
	win.show();
	//win.once('ready-to-show', () => { win.show(); });
});







/*
	Video Player Related

	Note:  	Tried using Quicktime Player on MacOS but it would resize and stop constantly due to playlists
			Was successful doing a couple tests with Windows Media Player on Windows
			Thought of allowing user to choose in future version, just need to implement UI and handle it here

	For now, its an HLS video player in a web browser window...
*/
ipcMain.on('play-video', (event, arg) => {
	if (playerWindow == null) {
		playerWindow = new BrowserWindow({
			width: 368, height: 640, resizable: true, darkTheme:true, autoHideMenuBar:false, show:true, skipTaskbar: false,
			disableAutoHideCursor:true, titleBarStyle: 'default', fullscreen:false, maximizable:false, frame:false
		});
		playerWindow.on('closed', () => { 
			playerWindow = null; 
		});		
	}
	playerWindow.loadURL(`file://${__dirname}/lmt/player.html#`+arg.url);

});
ipcMain.on('hide-player', (event, arg) => { 
	playerWindow.close(); 
});






/* 
	Chat Window 
*/
ipcMain.on('open-chat', (event, arg) => {
	if (chatWindow.isVisible() == false) { chatWindow.showInactive(); }
	chatWindow.webContents.send('set-chat', { url: arg.url, startTime: arg.startTime });
});
ipcMain.on('hide-chat', () => { chatWindow.hide(); });


/*
	Relay for downloads
*/
ipcMain.on('download-add', (event, arg) => {
	if (!queuewin.isVisible()) {
		queuewin.showInactive();
	}

	queuewin.send('download-add', arg);
});

ipcMain.on('download-finish', (event, arg) => {
	queuewin.send('download-finish', arg);
});

ipcMain.on('download-error', (event, arg) => {
	queuewin.send('download-error', arg);
});

ipcMain.on('download-progress', (event, arg) => {
	queuewin.send('download-progress', arg);
});

ipcMain.on('download-start', (event, arg) => {
	queuewin.send('download-start', arg);
});

ipcMain.on('download-pause', (event, arg) => {
	queuewin.send('download-pause', arg);
});

ipcMain.on('download-resume', (event, arg) => {
	queuewin.send('download-resume', arg);
});

ipcMain.on('download-pause-request', (event, arg) => {
	mainwin.send('download-pause-request', arg);
});

ipcMain.on('download-resume-request', (event, arg) => {
	mainwin.send('download-resume-request', arg);
});

/*
	History relay
*/

ipcMain.on('history-delete', (event, arg) => {
	mainwin.send('history-delete', {});
});





function getMenuTemplate () {
	var template = [
	{
		label: 'Edit',
		submenu: [
			{
				label: 'Cut',
				accelerator: 'CmdOrCtrl+X',
				role: 'cut'
			},
			{
				label: 'Copy',
				accelerator: 'CmdOrCtrl+C',
				role: 'copy'
			},
			{
				label: 'Paste',
				accelerator: 'CmdOrCtrl+V',
				role: 'paste'
			},
			{
				label: 'Select All',
				accelerator: 'CmdOrCtrl+A',
				role: 'selectall'
			},
			/*
			{
				type: 'separator'
			},
			{
				label: 'Preferences',
				accelerator: 'CmdOrCtrl+,',
				click: () => windows.main.dispatch('preferences')
			}
			*/
			]
		},
		/*
		{
			label: 'Help',
			role: 'help',
			submenu: [
			{
				label: 'Learn more about ' + config.APP_NAME,
				click: () => shell.openExternal(config.HOME_PAGE_URL)
			},
			{
				label: 'Contribute on GitHub',
				click: () => shell.openExternal(config.GITHUB_URL)
			},
			{
				type: 'separator'
			},
			{
				label: 'Report an Issue...',
				click: () => shell.openExternal(config.GITHUB_URL_ISSUES)
			}
			]
		}
		*/
	]

	if (process.platform === 'darwin') {
		// Add WebTorrent app menu (OS X)
		template.unshift({
			label: 'LiveMe Tools',
			submenu: [
				{
					label: 'Services',
					role: 'services',
					submenu: []
				},
				{
					type: 'separator'
				},
				{
					label: 'Hide LiveMe Tools',
					accelerator: 'Command+H',
					role: 'hide'
				},
				{
					label: 'Hide Others',
					accelerator: 'Command+Alt+H',
					role: 'hideothers'
				},
				{
					label: 'Show All',
					role: 'unhide'
				},
				{
					type: 'separator'
				},
				{
					label: 'Quit',
					accelerator: 'Command+Q',
					click: () => app.quit()
				}
			]
		});

		/*
		// Add Window menu (OS X)
		template.splice(5, 0, {
		label: 'Window',
		role: 'window',
		submenu: [
		{
		label: 'Minimize',
		accelerator: 'CmdOrCtrl+M',
		role: 'minimize'
		},
		{
		type: 'separator'
		},
		{
		label: 'Bring All to Front',
		role: 'front'
		}
		]
		})
		*/
		}

	/*
	// On Windows and Linux, open dialogs do not support selecting both files and
	// folders and files, so add an extra menu item so there is one for each type.
	if (process.platform === 'linux' || process.platform === 'win32') {

	// Help menu (Windows, Linux)
	template[4].submenu.push(
	{
	type: 'separator'
	},
	{
	label: 'About ' + config.APP_NAME,
	click: () => windows.about.init()
	}
	)
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
	*/

	return template
}
