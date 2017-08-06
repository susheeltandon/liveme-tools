/*

	  _      _           __  __        _______          _     
	 | |    (_)         |  \/  |      |__   __|        | |    
	 | |     ___   _____| \  / | ___     | | ___   ___ | |___ 
	 | |    | \ \ / / _ \ |\/| |/ _ \    | |/ _ \ / _ \| / __|
	 | |____| |\ V /  __/ |  | |  __/    | | (_) | (_) | \__ \
	 |______|_| \_/ \___|_|  |_|\___|    |_|\___/ \___/|_|___/

													v3.0.0
		
		(c)2017 by TheCoder - Licensed under GPL3 now


*/
const 	{app, BrowserWindow, ipcMain, Menu} = require('electron'), os = require('os'), 
		fs = require('fs'), isDev = require('electron-is-dev');
		

let mainwin, queuewin, playerWindow, menu;

function createWindow(){
		mainwin=new BrowserWindow({
		icon: __dirname + '/appicon.ico', width:980, height:600, minWidth:980, minHeight:522, darkTheme:true, autoHideMenuBar:false,
		disableAutoHideCursor:true, titleBarStyle: 'default', fullscreen:false, maximizable:false, frame:false, vibrancy:'dark', 
		webPreferences:{ webSecurity:false, textAreasAreResizable:false, plugins:true }
	});

	queuewin=new BrowserWindow({
		width:600, height:320, resizable:false, darkTheme:true, autoHideMenuBar:false, show: false, skipTaskbar: false,
		disableAutoHideCursor:true, titleBarStyle: 'default', fullscreen:false, maximizable:false, frame:false, 
		webPreferences:{ webSecurity:false, plugins:true, devTools:true }
	});

	mainwin.loadURL(`file://${__dirname}/lmt/index.html`);
	mainwin.on('closed', () => { 
		mainwin = null; 
		queuewin.close();
		app.quit();
	});

	queuewin.loadURL(`file://${__dirname}/lmt/queue.html`);
	//queuewin.openDevTools();
	queuewin.on('closed', () => { 
		queuewin = null; 
	});

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
	app.quit();
});
app.on('activate', () => { if (mainwin === null) { createWindow(); } });



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
	queuewin.webContents.send('add-to-queue', { url: arg.url });
});
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
			width: 360, height: 640, resizable: true, darkTheme:true, autoHideMenuBar:false, show:true, skipTaskbar: false,
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
