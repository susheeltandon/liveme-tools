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
		fs = require('fs'), isDev = require('electron-is-dev'), path = require('path'),
		request = require('request');
		

let 	mainwin, queuewin, playerWindow, settingsWindow, favoritesWindow, chatWindow, 
		splashWindow, menu, appSettings = require('electron-settings');

function createWindow(){
	/*
		Load Settings
	*/
	if (!appSettings.get('downloads.directory')) {
		appSettings.set('downloads', {
			directory : path.join(app.getPath('home'), 'Downloads'),
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
		disableAutoHideCursor:true, titleBarStyle: 'default', fullscreen:false, maximizable:false, frame:false, vibrancy:'dark', backgroundColor: '#4a4d4e',
		webPreferences:{ webSecurity:false, textAreasAreResizable:false, plugins:true }
	});

	queuewin=new BrowserWindow({
		width: 640, height: 400, resizable:true, minWidth:640, maxWidth: 640, minHeight: 160, maxHeight: 1600, darkTheme:true, autoHideMenuBar:false, show: false, skipTaskbar: false,
		disableAutoHideCursor:true, titleBarStyle: 'default', fullscreen:false, maximizable:false, frame:false, backgroundColor: '#4a4d4e',
		webPreferences:{ webSecurity:false, plugins:true, devTools:true }
	});

	chatWindow = new BrowserWindow({
		width: 320, height: 760, resizable: true, darkTheme:true, autoHideMenuBar:false, show:false, skipTaskbar: false, backgroundColor: '#4a4d4e',
		disableAutoHideCursor:true, titleBarStyle: 'default', fullscreen:false, maximizable:false, frame:false
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

	chatWindow.loadURL(`file://${__dirname}/lmt/chat.html`);
	chatWindow.on('closed', () => { 
		chatWindow = null; 
	});

	showSplashWindow();

	/*
		Only use custom menus if app is compiled, otherwise leave menus alone during development testing.
	*/
	if (isDev == false) {
		menu = Menu.buildFromTemplate(getMenuTemplate())
		Menu.setApplicationMenu(menu)
	}

	setTimeout(function(){
		CheckForUpgrade();
	}, 15000);

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
	Splash/About Window
*/
function showSplashWindow() {
	splashWindow=new BrowserWindow({
		width: 480, height: 212, resizable:false, darkTheme:true, autoHideMenuBar:true, show: true, skipTaskbar: true, backgroundColor: '#4a4d4e',
		disableAutoHideCursor:true, titleBarStyle: 'default', fullscreen:false, maximizable:false, frame:false, movable: false,
		parent: mainwin, child: true, webPreferences:{ webSecurity:false, plugins:false, devTools:false }
	});
	splashWindow.loadURL(`file://${__dirname}/lmt/splash.html`);
	splashWindow.on('closed', () => { 
		splashWindow = null; 
	});	
}




/*
	Favorites Related
*/
ipcMain.on('show-favorites', () => {
	favoritesWindow = new BrowserWindow({
		width:320, height:720, resizable:false, darkTheme:true, autoHideMenuBar:false, show: true, skipTaskbar: false, backgroundColor: '#4a4d4e',
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
	if (typeof favoritesWindow == 'undefined') return;
	favoritesWindow.send('favorites-refresh');
});








/*
	Settings Related
*/
ipcMain.on('show-settings', () => {
	showSettings();
});

function showSettings() {
	var settingsWindow = new BrowserWindow({
		width: 900, height: 360, resizable:false, darkTheme:true, autoHideMenuBar:false, show: true, skipTaskbar: false, center: true, backgroundColor: '#4a4d4e',
		disableAutoHideCursor:true, titleBarStyle: 'default', fullscreen:false, maximizable:false, frame:false, 
		parent: mainwin, modal: false, webPreferences:{ webSecurity:false, plugins:true, devTools:true }
	});
	settingsWindow.loadURL(`file://${__dirname}/lmt/settings.html`);
	settingsWindow.on('closed', () => { 
		settingsWindow = null; 
	});
	settingsWindow.show();
}






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
	Popup Windows (Followings/Fans)
*/
ipcMain.on('open-window', (event, arg) => {
	var win = new BrowserWindow({
		width: 320, height: 720, resizable:false, darkTheme:true, autoHideMenuBar:false, skipTaskbar: false, backgroundColor: '#4a4d4e',
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
			width: 368, height: 640, resizable: true, darkTheme:true, autoHideMenuBar:false, show:true, skipTaskbar: false, backgroundColor: '#4a4d4e',
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
	chatWindow.showInactive();
	chatWindow.webContents.send('set-chat', { url: arg.url, startTime: arg.startTime });
});
ipcMain.on('hide-chat', () => { chatWindow.hide(); });







/*
	Relay for downloads
*/
ipcMain.on('download-add', (event, arg) => {
	if (typeof queuewin == 'undefined') {
		console.log('Impossible error: queuewin undefined.  This should never happen.');
		return;
	}
	
	if (!queuewin.isVisible()) {
		queuewin.showInactive();
	}

	queuewin.send('download-add', arg);
});

ipcMain.on('show-queue', () => { 
	queuewin.show(); 
});

ipcMain.on('hide-queue', () => { 
	queuewin.hide(); 
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

ipcMain.on('download-remove-request', (event, arg) => {
	mainwin.send('download-remove-request', arg);
});

ipcMain.on('download-remove', (event, arg) => {
	queuewin.send('download-remove', arg);
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
				{role: 'undo'},
				{role: 'redo'},
				{type: 'separator'},
				{role: 'cut'},
				{role: 'copy'},
				{role: 'paste'},
				{role: 'delete'},
				{role: 'selectall'}
			]
		}
	];


	if (process.platform === 'darwin') {
		template.unshift({
			label: app.getName(),
			submenu: [
				{role: 'about'},
				{type: 'separator'},
				{role: 'services', submenu: []},
				{type: 'separator'},
				{role: 'hide'},
				{role: 'hideothers'},
				{role: 'unhide'},
				{type: 'separator'},
				{role: 'quit'}
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
	/*
		To do this we query the github repo and get the raw contents of the package.json file

		There's an entry called minversion that we will compare to so we can determine if we
		need to notify user of an upgrade being available.
	*/
	var r = new Date().getTime();
	request({
		url: 'https://raw.githubusercontent.com/thecoder75/liveme-tools/master/src/package.json?random='+r,
		timeout: 15000,
	}, function (err, response, body) {
		var js = JSON.parse(body), isCurrent = js.minversion < app.getVersion();

		if (!isCurrent) {
			var win = new BrowserWindow({
				width: 400, height: 240, resizable:false, darkTheme:true, autoHideMenuBar:false, skipTaskbar: false, backgroundColor: '#4a4d4e',
				disableAutoHideCursor:true, titleBarStyle: 'default', fullscreen:false, maximizable:false, frame:false
			});
			win.loadURL(`file://${__dirname}/lmt/upgrade.html`);
			win.show();
		}
		
	});

}


