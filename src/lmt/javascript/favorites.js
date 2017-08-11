const remote = require('electron').remote, ipcRenderer = require('electron').ipcRenderer, app = remote.app, fs = require('fs'), path = require('path');
var favorites_list = [], clean_list = [];

$(function(){
	var fn = path.join(app.getPath('appData'), app.getName(), 'favorites.json');
	
	fs.readFile(fn, 'utf8', function (err,data) {
		if (err) {
			favorites_list = [];
		} else {
			favorites_list = JSON.parse(data);
		}

		$('#small_user_list').html('');
		if (favorites_list.length < 1) {
			$('#small_user_list').html('<p style="padding-top: 260px; text-align: center; font-style: italic; color: rgba(255,255,255,0.4)">Your list is empty.</p>');
		} else {
			for (i = 0; i < favorites_list.length; i++) {
				if (typeof (favorites_list[i].uid) != 'undefined') {
					var t = '<div title="Click to view user\'s videos." class="user_entry small clickable ' + favorites_list[i].sex + '" onClick="getVideos(\'' + favorites_list[i].uid + '\')"><img class="avatar" src="' + favorites_list[i].face + '" onerror="this.src=\'images/blank.png\'"><h4>' + favorites_list[i].nickname + '</h4></div>';
					$("#small_user_list").append(t);
					clean_list.push(favorites_list[i]);
				} 
			}
			fs.writeFile(fn, JSON.stringify(clean_list), 'utf8', function() {} );
		}
	});
	
});
function closeWindow() { window.close(); }
function getVideos(e) {
	var {ipcRenderer} = require('electron')
	ipcRenderer.send('submit-search', { userid: e });
}
