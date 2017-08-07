const remote = require('electron').remote, app = remote.app, fs = require('fs');

$(function(){
	getSettings();
});

function closeWindow() { window.close(); }

function getSettings() {
	var fn = app.getPath('appData') + '/' + app.getName() +'/settings.json';
	
	fs.readFile(fn, 'utf8', function (err,data) {
		if (err) {
			settings = {
				downloadpath : app.getPath('home') + '/Downloads'
			};
		} else {
			settings = JSON.parse(data);
		}
		
		$('#download_folder').val(settings.downloadpath);

		return;
	});
}

function setSettings() {
	fs.writeFile(app.getPath('appData') + '/' + app.getName() + '/settings.json', JSON.stringify(settings), 'utf8', function(){
		window.close();
	});
}