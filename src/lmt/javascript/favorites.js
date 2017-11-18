const 	{ remote, ipcRenderer } = require('electron'), DataManager = remote.getGlobal('DataManager');

$(function(){
	
	setTimeout(function(){
		DataManager.loadFavorites();
	}, 50);

	DataManager.events.on('refresh_favorites', (data) => {

		$('#small_user_list').empty();

		for (i = 0; i < data.length; i++) {
			$("#small_user_list").append(`
				<div title="Click to view user's videos." class="item small clickable" onClick="getVideos('${data[i].id}')">
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


});

function getVideos(e) {
	ipcRenderer.send('submit-search', { userid: e });
}
function enterOnSearch(e) { if (e.keyCode == 13) beginSearch(); } 
function beginSearch() {
	var q = $('#query').val();

	$('.item').removeClass('highlight');
	$('.item:contains(\''+q+'\')').addClass('highlight');

	var f = $('.item:contains(\''+q+'\')');
	if (f != null) {
		$('main').animate({
			scrollTop: f.offset().top - f.height()
		}, 400);
	}
}
