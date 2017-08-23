const { remote, ipcRenderer } = require('electron'), Favorites = require('./modules/favorites');

$(function(){
	setTimeout(function(){
		Favorites.load();
	}, 250);

	ipcRenderer.on('favorites-refresh' , function(event , data) { 
		Favorites.recall(function(e){
			$('#small_user_list').empty();
			for (i = 0; i < e.length; i++) {
				$("#small_user_list").append(`
					<div title="Click to view user's videos." class="user_entry small clickable ${e[i].sex}" onClick="getVideos('${e[i].uid}')">
						<img class="avatar" src="${e[i].face}" onerror="this.src='images/blank.png'">
						<h4>${e[i].nickname}</h4>
					</div>
				`);
			}
		});
	});


});

function closeWindow() { window.close(); }

function getVideos(e) {
	ipcRenderer.send('submit-search', { userid: e });
}

function updateList() {
	Favorites.update();
}