const 	{ remote, ipcRenderer } = require('electron'), Favorites = remote.getGlobal('Favorites'), 
		eventEmitter = remote.getGlobal('eventEmitter');

$(function(){
	eventEmitter.on('favorites-refresh', (data) => {

		console.log('Favorites refresh invoked.');

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

	setTimeout(function(){
		Favorites.refresh();	
	}, 250);	

});

function closeWindow() { window.close(); }

function getVideos(e) {
	ipcRenderer.send('submit-search', { userid: e });
}

function updateList() {
	Favorites.update();
}

function exportList() {
	let d = remote.dialog.showSaveDialog(
		remote.getCurrentWindow(),
		{
			filters: [ { name: "Text File", extensions: ["txt"] }, { name: 'All Files', extensions: ['*'] } ],
			defaultPath: "favorites.txt"
		}
	);

	if (typeof d == "undefined") return;

	Favorites.export(d);
}