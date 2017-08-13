const { remote, ipcRenderer } = require('electron'), Favorites = require('./modules/favorites');

var last_change = 0;

$(function(){
	Favorites.initIfNeeded();

	setInterval(function(){
		console.log(Favorites.lastChange() + ' -- ' + last_change);
		if ((Favorites.lastChange() - last_change) > 30) {
			Favorites.recall(function(e){
				$('#small_user_list').html('');
				for (i = 0; i < e.length; i++) {
					$("#small_user_list").append(`
						<div title="Click to view user's videos." class="user_entry small clickable ${e[i].sex}" onClick="getVideos('${e[i].uid}')">
							<img class="avatar" src="${e[i].face}" onerror="this.src='images/blank.png'">
							<h4>${e[i].nickname}</h4>
						</div>
					`);
				}
			});
			last_change = Favorites.lastChange();
		}
	}, 1000);
});

function closeWindow() { window.close(); }

function getVideos(e) {
	ipcRenderer.send('submit-search', { userid: e });
}
