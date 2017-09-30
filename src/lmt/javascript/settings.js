const {electron, remote, ipcRenderer} = require('electron'), appSettings = remote.require('electron-settings');
const path = require('path');

$(function() {

	if (appSettings.has('downloads.directory') == false) {
		appSettings.set('downloads', {
			directory : path.join(remote.app.getPath('home'), 'Downloads'),
			filemode: 0,
			filetemplate: '',
			history: true
		});
	}

	// Upgrading from < 6.0.5 to >= 6.0.6
	if (appSettings.has('downloads.directory') != false && appSettings.has('downloads.ffmpegAutodetect') == false) {
		appSettings.set('downloads', {
			directory: appSettings.get('downloads.directory'),
			filemode: appSettings.get('downloads.filemode'),
			filetemplate: appSettings.get('downloads.filetemplate'),
			history: appSettings.get('downloads.history'),
			ffmpegAutodetect: 1,
			ffmpeg: ''
		});
	}

	setTimeout(function(){
		$('#download_folder').val(appSettings.get('downloads.directory'));
		$('#filemode').prop('checked', appSettings.get('downloads.filemode'));
		$('#filetemplate').val(appSettings.get('downloads.filetemplate'));
		$('#history').prop('checked', appSettings.get('downloads.history'));
		$('#ffmpegautodetect').prop('checked', appSettings.get('downloads.ffmpegAutodetect'));
		$('#ffmpegpath').val(appSettings.get('downloads.ffmpeg'));
		checkType();
	}, 1);
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
		ffmpeg: $('#ffmpegpath').val(),
		ffmpegAutodetect: $('#ffmpegautodetect').is(':checked') ? 1 : 0
	});

	if (oldHistory && !appSettings.get('downloads.history')) {
		ipcRenderer.send('history-delete');
	}
	
	closeWindow();
}

function checkType() {
	if ($('#filemode').is(':checked') == 0) {
		$('#ftblock-yes').hide();
		$('#ftblock-no').show();
	} else {
		$('#ftblock-no').hide();
		$('#ftblock-yes').show();
	}

	if ($('#ffmpegautodetect').is(':checked') == 0) {
		$('#ffmpegPathBox').show();
	} else {
		$('#ffmpegPathBox').hide();
	}
}

function SetDownloadPath() {
	var dir_path = remote.dialog.showOpenDialog({
		properties: ['openDirectory']
	});
	if (typeof (dir_path) != 'undefined') {
		$('#download_folder').val(dir_path);
	}
}

function setFfmpegPath() {
	var path = remote.dialog.showOpenDialog({
		properties: ['openFile']
	});
	if (typeof (path) != 'undefined') {
		$('#ffmpegpath').val(path);
	}
}