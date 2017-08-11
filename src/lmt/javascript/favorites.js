const { remote, ipcRenderer } = require('electron').remote, app = remote.app, Favorites = require('./module/favorites');

var last_change = 0;

$(function(){
	setInterval(function(){
		var lc = Favorites.lastChange();
		if ((last_change - lc) > 300) {
			Favorites.load(function(e){
				for (i = 0; i < e.length; i++) {
					var t = '<div title="Click to view user\'s videos." class="user_entry small clickable ' + e[i].sex + '" onClick="getVideos(\'' + e[i].uid + '\')"><img class="avatar" src="' + e[i].face + '" onerror="this.src=\'images/blank.png\'"><h4>' + e[i].nickname + '</h4></div>';
					$("#small_user_list").append(t);
				}
			});
			last_change = lc;
		}
	}, 500);
});

function closeWindow() { window.close(); }

function getVideos(e) {
	ipcRenderer.send('submit-search', { userid: e });
}
