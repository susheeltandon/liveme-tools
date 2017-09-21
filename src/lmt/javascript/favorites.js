const 	{ remote, ipcRenderer } = require('electron'), Favorites = remote.getGlobal('Favorites');

$(function(){
	Favorites.events.on('refresh', (data) => {
		$('#small_user_list').empty();
		for (i = 0; i < data.length; i++) {
			$("#small_user_list").append(`
				<div title="Click to view user's videos." class="item small clickable" onClick="getVideos('${data[i].uid}')">
					<div class="avatar">
						<img src="${data[i].face}" class="${data[i].sex}" onerror="this.src='images/blank.png'">
					</div>
					<div class="content">
						<div class="header">${data[i].nickname}</div>
						<div class="subheader">${data[i].usign}</div>
						<div class="meta aling-right">
							<div>${data[i].video_count} videos</div>
						</div>
					</div>
				</div>
			`);
		}		
	});

	Favorites.events.on('status', (m) => {
		$('#small_user_list').html(`<div class="empty">${m}</div>`);
	});

	Favorites.refresh();	

});

function getVideos(e) {
	ipcRenderer.send('submit-search', { userid: e });
}

