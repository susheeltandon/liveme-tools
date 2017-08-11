const {electron, remote} = require('electron'), appSettings = remote.require('electron-settings');
const path = require('path');

$(function() {

	if (appSettings.has('downloads.directory') == false) {
		appSettings.set('downloads', {
			directory : path.join(remote.app.getPath('home'), 'Downloads'),
			filemode: 0,
			filetemplate: '',
			history: true,
			concurrent: 1
		});
		
	}

	setTimeout(function(){
		$('#download_folder').val(appSettings.get('downloads.directory'));
		$('#filemode').val(appSettings.get('downloads.filemode'));

	}, 250);
});

function closeWindow() {
	window.close();
}

function saveSettings() {
	appSettings.set('downloads', { directory: $('#download_folder').val() });
	closeWindow();
}



function SetDownloadPath() {
	var dir_path = remote.dialog.showOpenDialog({
		properties: ['openDirectory']
	});
	if (typeof (dir_path) != 'undefined') {
		appSettings.set('downloads', { directory: dir_path });
		$('#download_folder').val(dir_path);
	}
}
