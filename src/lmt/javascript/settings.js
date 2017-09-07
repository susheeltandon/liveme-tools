const {electron, remote, ipcRenderer} = require('electron'), appSettings = remote.require('electron-settings');
const path = require('path'), downloads = require('./modules/downloads');

$(function() {

	if (appSettings.has('downloads.directory') == false) {
		appSettings.set('downloads', {
			directory : path.join(remote.app.getPath('home'), 'Downloads'),
			filemode: 0,
			filetemplate: '',
			history: true,
			engine: 'internal'
		});
	}

	setTimeout(function(){
		$('#download_folder').val(appSettings.get('downloads.directory'));
		$('#filemode').prop('checked', appSettings.get('downloads.filemode'));
		$('#filetemplate').val(appSettings.get('downloads.filetemplate'));
		$('#history').prop('checked', appSettings.get('downloads.history'));
		$('#engine').val(appSettings.get('downloads.engine'));
		checkType();
	}, 100);
});

function closeWindow() {
	window.close();
}

function saveSettings() {
	let oldHistory = appSettings.get('downloads.history');

	appSettings.set('downloads', { 
		directory: $('#download_folder').val(), 
		filemode: $('#filemode').is(':checked') ? 1 : 0,
		filetemplate: $('#filetemplate').val(),
		history: $('#history').is(':checked') ? 1 : 0,
		engine: $('#engine').val()
	});

	if (oldHistory && !appSettings.get('downloads.history')) {
		ipcRenderer.send('history-delete');
	}

	closeWindow();
}

function flushDownloadQueue() { 
	downloads.purge_queue();
}

function checkType() {
	if ($('#filemode').is(':checked') == 0) {
		$('#ftblock-yes').hide();
		$('#ftblock-no').show();
	} else {
		$('#ftblock-no').hide();
		$('#ftblock-yes').show();
	}
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
