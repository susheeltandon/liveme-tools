/*

	  _      _           __  __        _______          _     
	 | |    (_)         |  \/  |      |__   __|        | |    
	 | |     ___   _____| \  / | ___     | | ___   ___ | |___ 
	 | |    | \ \ / / _ \ |\/| |/ _ \    | |/ _ \ / _ \| / __|
	 | |____| |\ V /  __/ |  | |  __/    | | (_) | (_) | \__ \
	 |______|_| \_/ \___|_|  |_|\___|    |_|\___/ \___/|_|___/

													v3.0.0
		
		(c)2017 by TheCoder - Licensed under GPL now


*/

const { remote, BrowserWindow, ipcRenderer } = require('electron');
const m3u8stream = require('m3u8stream');
const fs = require('fs');
const os = require('os');

var isDownloading = false, settings;

$(function(){

	var fn = remote.app.getPath('appData') + '/' + remote.app.getName() +'/settings.json';
	
	fs.readFile(fn, 'utf8', function (err,data) {
		if (err) {
			settings = {
				downloadpath : remote.app.getPath('home') + '/Downloads'
			};
		} else {
			settings = JSON.parse(data);
		}
		return;
	});


	ipcRenderer.on('add-to-queue', (event, arg) => { 
		var a=arg.url.split('/'),id=a[a.length-1];
		if (id.indexOf('playlist') > -1)id=a[a.length-2];
		$('#queuelist').append('<div class="entry" id="'+id+'">'+arg.url+'</div>');
		setTimeout(function(){
			if (isDownloading == false) beginDownload();	
		}, 250);
	});	
});

function beginDownload() {
	isDownloading = true;
	var u = $('.entry:first-child').text(), s = u.split('/'), f = s[s.length - 1];
	if (f.indexOf('playlist') > -1) f = s[s.length - 2];
	var ff = f.split('.'), filename = ff[0] + '.ts';
	$('.entry:first-child').addClass('active');
	
	m3u8stream(u, {
		on_complete: function() {
			$('.entry:first-child').remove();
			if ($('.entry').get().length > 0) {
				beginDownload();
			} else {
				isDownloading = false;ipc.send('hide-queue');
			}
		}
	}).pipe(fs.createWriteStream(settings.downloadpath+'/'+filename));
	
}
