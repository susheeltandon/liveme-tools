const appSettings = require('electron').remote.require('electron-settings');

$(function() {
	getSettings();
});

function closeWindow() {
	window.close();
}

function getSettings() {
	$('#download_folder').val(appSettings.get('downloader.directory'));
}

function setSettings() {
	appSettings.set('downloader', { directory: $('#download_folder').val() });
	closeWindow();
}