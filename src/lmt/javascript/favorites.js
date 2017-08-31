const { remote, ipcRenderer } = require('electron'), Favorites = require('./modules/favorites');

$(function(){
	setTimeout(function(){
		Favorites.load();
	}, 250);

	ipcRenderer.on('favorites-refresh' , function(event , data) { 
		$('#small_user_list').empty();
		for (i = 0; i < data.length; i++) {
			if (typeof data[i].stars == 'undefined') {
				$("#small_user_list").append(`
					<div title="Click to view user's videos." class="user_entry small clickable ${data[i].sex}" onClick="getVideos('${data[i].uid}')">
						<img class="avatar" src="${data[i].face}" onerror="this.src='images/blank.png'">
						<h4>${data[i].nickname}</h4>
					</div>
				`);
			} else {
				$("#small_user_list").append(`
					<div title="Click to view user's videos." class="user_entry small clickable ${data[i].sex}" onClick="getVideos('${data[i].uid}')">
						<img class="avatar" src="${data[i].face}" onerror="this.src='images/blank.png'">
						<h4 class="nickname">${data[i].nickname}</h4>
						<h4 class="usign">${data[i].usign}</h4>
						<h5>${data[i].video_count}</h5>
					</div>
				`);
			}
		}
	});


});

function closeWindow() { window.close(); }

function getVideos(e) {
	ipcRenderer.send('submit-search', { userid: e });
}

function updateList() {
	Favorites.update();
}