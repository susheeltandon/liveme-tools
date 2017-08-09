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
const fs = require('fs');
const os = require('os');
const m3u8stream = require('./m3u8stream/index');
var isDownloading = false, settings, queue_index = 0, queue = [], download_history = [];


$(function(){

	// Fetch Settings
	fs.readFile(remote.app.getPath('appData') + '/' + remote.app.getName() +'/settings.json', 'utf8', function (err,data) {
		if (err) {

			settings = {
				downloadpath : remote.app.getPath('home') + '/Downloads'
			};
		} else {
			settings = JSON.parse(data);
		}
	});

	// Fetch last queue
	fs.readFile(remote.app.getPath('appData') + '/' + remote.app.getName() +'/download_queue.json', 'utf8', function (err,data) {
		if (err) {
			queue = [];
		} else {
			queue = JSON.parse(data);
			if (queue.length > 0) {
				for (i = 0; i< queue.length; i++)
					$('#queuelist').append('<div class="entry" id="'+queue[i].id+'"><div class="title">'+queue[i].url+'</div><div class="progress"></div></div>');

				ipcRenderer.send('show-queue');
				setTimeout(function(){
					beginDownload();
				}, 1000);
			}
		}


	});

	// Fetch History
	fs.readFile(remote.app.getPath('appData') + '/' + remote.app.getName() +'/download_history.json', 'utf8', function (err,data) {
		if (err) {
			download_history = [ '-' ];
		} else {
			download_history = JSON.parse(data);
		}
	});

	ipcRenderer.on('add-to-queue', (event, arg) => { 
		var a=arg.url.split('/'),b=a[a.length-1].split('.'),id=b[0],add=true;
		if (id.indexOf('playlist') > -1)id=a[a.length-2];

		if (download_history.length > 0)
			for (i = 0; i < download_history.length; i++) {
				if (download_history[i] == arg.url) { 
					add = false;
					break;
				}
			}

		if (queue.length > 0)
			for (i = 0; i < queue.length; i++)
				if (queue[i].url == arg.url) add=false;

		if (add) {
			queue.push({
				url: arg.url,
				file: id+'.ts',
				id : id
			});
			$('#queuelist').append('<div class="entry" id="'+id+'"><div class="title">'+arg.url+'</div><div class="progress"></div></div>');
		}
	
		fs.writeFile(remote.app.getPath('appData') + '/' + remote.app.getName() + '/download_queue.json', JSON.stringify(queue), 'utf8', function() {} );

		setTimeout(function(){
			if (isDownloading == false) beginDownload();	
		}, 100);
	});	
});

function beginDownload() {

	if (queue.length < 1) return;

	isDownloading = true;

	if (download_history.length > 0) {
		var tlist = [];

		for (j = 0; j < queue.length; j++) {
			var add = true;
			for (i = 0; i < download_history.length; i++) {
				if (download_history[i] == queue[j].url) { 
					add = false;
				}
			}
			if (add) tlist.push(queue[j]);
		}

		queue = tlist;
	}

	if (queue.length < 1) return;

	$('#queuelist').html('');
	for (i = 0; i < queue.length; i++) {
		$('#queuelist').append('<div class="entry" id="'+queue[i].id+'"><div class="title">'+queue[i].url+'</div><div class="progress"></div></div>');		
	}
	$('#'+queue[0].id).addClass('active');

	m3u8stream(queue[0].url, {
		on_complete: function(e) {
			download_history.push(e.url);
			$('.entry.active').remove();
			fs.writeFile(remote.app.getPath('appData') + '/' + remote.app.getName() + '/download_history.json', JSON.stringify(download_history), 'utf8', function(){});

			if (queue.length > 0) {
				beginDownload();
			} else {
				isDownloading = false;
				ipcRenderer.send('hide-queue');
			}
		},
		on_error: function(e) {
			if (queue.length > 0) {
				beginDownload();
			} else {
				isDownloading = false;
				ipcRenderer.send('hide-queue');
			}
		},
		on_progress: function(e) {
			var p = Math.round((e.current / e.total) * 100);
			$('.entry.active .progress').css({ width: p+'%' });
		}
	}).pipe(fs.createWriteStream(settings.downloadpath+'/'+queue[0].file));

	queue.shift();

	
}
