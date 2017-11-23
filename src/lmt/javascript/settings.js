const 	{electron, remote, ipcRenderer} = require('electron'),
		appSettings = remote.require('electron-settings'),
		DownloadManager = remote.getGlobal('DownloadManager'),
		DataManager = remote.getGlobal('DataManager');

const	path = require('path');

$(function() {

	if (appSettings.has('downloads.directory') == false) {
		appSettings.set('downloads', {
			directory : path.join(remote.app.getPath('home'), 'Downloads'),
			filemode: 0,
			filetemplate: '',
			history: true,
			ffmpeg: 'ffmpeg',
			ffprobe: 'ffprobe'
		});
		appSettings.set('profiles', {
			visitedtimeout: 86400
		});
	}

	// 7.0.1 upgrade
	if (appSettings.has('profiles.visitedtimeout') == false) {
		appSettings.set('profiles', {
			visitedtimeout: 86400
		});
	}

	// Upgrading from < 6.0.5 to >= 6.0.6
	if (appSettings.has('downloads.directory') != false && appSettings.has('downloads.ffmpeg') == false) {
		appSettings.set('downloads', {
			directory: appSettings.get('downloads.directory'),
			filemode: appSettings.get('downloads.filemode'),
			filetemplate: appSettings.get('downloads.filetemplate'),
			history: appSettings.get('downloads.history'),
			ffmpeg: 'ffmpeg',
			ffprobe: 'ffprobe'
		});
		appSettings.set('profiles', {
			visitedtimeout: 86400
		});
	}

	setTimeout(function(){
		$('#download_folder').val(appSettings.get('downloads.directory'));
		$('#filemode').prop('checked', appSettings.get('downloads.filemode'));
		$('#filetemplate').val(appSettings.get('downloads.filetemplate'));
		$('#history').prop('checked', appSettings.get('downloads.history'));
		$('#ffmpegpath').val(appSettings.get('downloads.ffmpeg'));
		$('#ffprobepath').val(appSettings.get('downloads.ffprobe'));
		$('#ptimeout').val(appSettings.get('profiles.visitedtimeout'));
		checkType();
	}, 1);
});

function closeWindow() {
	window.close();
}

function saveSettings(close=true) {
	let oldHistory = appSettings.get('downloads.history');

	appSettings.set('downloads', {
		directory: $('#download_folder').val(),
		filemode: $('#filemode').is(':checked') ? 1 : 0,
		filetemplate: $('#filetemplate').val(),
		history: $('#history').is(':checked') ? 1 : 0,
		ffmpeg: $('#ffmpegpath').val(),
		ffprobe: $('#ffprobepath').val()
	});
	appSettings.set('profiles', {
		visitedtimeout: $('#ptimeout').val()
	});

	DownloadManager.setFfmpegPath(appSettings.get('downloads.ffmpeg'));
	DownloadManager.setFfprobePath(appSettings.get('downloads.ffprobe'));

	if (oldHistory && !appSettings.get('downloads.history')) {
		ipcRenderer.send('history-delete');
	}

	if (close) {
		closeWindow();
	}
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

function setFfprobePath() {
	var path = remote.dialog.showOpenDialog({
		properties: ['openFile']
	});
	if (typeof (path) != 'undefined') {
		$('#ffprobepath').val(path);
	}
}

function checkFfmpeg() {
	saveSettings(false);

	DownloadManager.detectFFMPEG().then(result => {
		if (result) {
			remote.dialog.showMessageBox(null, { type: "info", buttons: [ "OK" ], title: "LiveMe Tools", message: "FFMPEG check passed" });
		} else {
			remote.dialog.showErrorBox('LiveMe Tools', 'FFMPEG check failed');
		}
	});
}
