/*

	  _      _           __  __        _______          _     
	 | |    (_)         |  \/  |      |__   __|        | |    
	 | |     ___   _____| \  / | ___     | | ___   ___ | |___ 
	 | |    | \ \ / / _ \ |\/| |/ _ \    | |/ _ \ / _ \| / __|
	 | |____| |\ V /  __/ |  | |  __/    | | (_) | (_) | \__ \
	 |______|_| \_/ \___|_|  |_|\___|    |_|\___/ \___/|_|___/

*/

const 	{ electron, BrowserWindow, remote, ipcRenderer, shell } = require('electron'),
		fs = require('fs'), path = require('path'), 
		appSettings = remote.require('electron-settings'),
		Favorites = require('./modules/favorites'),
		Downloads = require('./modules/downloads');

var isSearching = false, favorites_list = [], debounced = false, current_user = {};

$(function(){

	$('header h1 small').html(remote.app.getVersion());

	onTypeChange();

	// Custom popup menu for text fields
	const InputMenu = remote.Menu.buildFromTemplate([{
	        label: 'Cut Text',
	        role: 'cut',
	    }, {
	        label: 'Copy Text',
	        role: 'copy',
	    }, {
	        label: 'Paste Text',
	        role: 'paste',
	    }, {
	        type: 'separator',
	    }, {
	        label: 'Select All Text',
	        role: 'selectall',
	    },
	]);

	const InputMenu2 = remote.Menu.buildFromTemplate([{
	        label: 'Copy Link',
	        role: 'copy',
	    }
	]);


	document.body.addEventListener('contextmenu', (e) => {
	    e.preventDefault();
	    e.stopPropagation();

	    let node = e.target;

	    while (node) {
	        if (node.nodeName.match(/^(input|textarea)$/i) || node.isContentEditable) {
	            InputMenu.popup(remote.getCurrentWindow());
	            break;
	        }
	        if (node.nodeName.match(/^(a)$/i)) {
	            InputMenu2.popup(remote.getCurrentWindow());
	            break;
	        }
	        node = node.parentNode;
	    }
	});	

	// Remote search calls
	ipcRenderer.on('do-search' , function(event , data) { 
		if (isSearching) return;

		$('#query').val(data.userid);
		$('#type').val('user-lookup');
		beginSearch2();
	});

	ipcRenderer.on('do-shutdown' , function(event , data) { 
		Favorites.forceSave();
		Downloads.forceSave();
	});

	Favorites.load();
	Downloads.load();

	ipcRenderer.on('history-delete', function(event, data) {
		Downloads.purge_history();
	});

	ipcRenderer.on('download-pause-request', function(event, data) {
		Downloads.stop();
		ipcRenderer.send('download-pause', {});
	});

	ipcRenderer.on('download-resume-request', function(event, data) {
		Downloads.resume();
		ipcRenderer.send('download-resume', {});
	});

	ipcRenderer.on('download-remove-request', function(event, data) {
		Downloads.remove(data.id);
		ipcRenderer.send('download-remove', data);
	});
});

function showMainMenu() {

	const MainAppMenu = remote.Menu.buildFromTemplate(
		[
			{
				label: 'Import Link List',
				click: () => showUpload()
			},
			{
				type: 'separator'
			},
			{
				label: 'Open Favorites Window',
				click: () => showFavorites()
			},
			{
				type: 'separator'
			},
			{
				label: 'Toggle Queue Window',
				click: () => showQueue()
			},
			{
				type: 'separator'
			},
			{
				label: 'LiveMe Tools Github Page',
				click: () => shell.openExternal('https://github.com/thecoder75/liveme-tools/')
			},
			{
				label: 'Report an Issue',
				click: () => shell.openExternal('https://github.com/thecoder75/liveme-tools/issues')
			},
			{
				type: 'separator'
			},
			{
				label: 'Settings',
				click: () => showSettings()
			},
			{
				type: 'separator'
			},
			{
				label: 'Quit LiveMe Tools',
				click: () => remote.app.quit()
			},

		]
	);	

	MainAppMenu.popup(
		remote.getCurrentWindow(),
		{
			x: 0,
			y: 40
		}
	)

}

function cancelAction() { cancelLMTweb = true; }

function showSettings() { ipcRenderer.send('show-settings'); }
function showFavorites() { ipcRenderer.send('show-favorites'); }
function showQueue() { ipcRenderer.send('show-queue'); }

function closeApp() { remote.app.quit(); }
function enterOnSearch(e) { if (e.keyCode == 13) beginSearch(); } 

function onTypeChange() {
	var t=$('#type').val();
	switch (t) {
		case 'user-lookup': $('#query').attr('placeholder', 'Short or Long UserID'); $('#maxlevel').hide(); break;
		case 'video-lookup': $('#query').attr('placeholder', 'Enter VideoID'); $('#maxlevel').hide(); break;
		case 'url-lookup': $('#query').attr('placeholder', 'Enter URL'); $('#maxlevel').hide(); break;
		case 'search': $('#query').attr('placeholder', 'Enter Partial or Full Username'); $('#maxlevel').show(); break;
		case 'hashtag': $('#query').attr('placeholder', 'Enter a hashtag'); $('#maxlevel').hide(); break;
	}
}



function showUpload() {
	var d = remote.dialog.showOpenDialog(
		remote.getCurrentWindow(),
		{
			properties: [
				'openFile'
			]
		}
	);

	if (typeof d == "undefined") return;
	
	// Get contents of file...
	fs.readFile(d[0], 'utf8', function (err,data) {
		if (err) {
			remote.dialog.showErrorBox(
				'Import Error',
				'There was an error while attempting to import the selected file.'
			);
			return;
		} else {
			var filelist = data.split('\n');
			
			for (i = 0; i < filelist.length; i++)  {
				if (filelist[i].indexOf('http') > -1) {
					Downloads.add({
						user: {
							id: null,
							name: null
						},
						video: {
							id: null,
							title: null,
							time: 0,
							url: filelist[i].trim()
						}
					});

				}
			}

		}
		
		return;
	});

}

function toggleFavorite() {
	if (Favorites.isOnList(current_user.uid) == true) {
		Favorites.remove(current_user.uid);
		$('#favorites_button').removeClass('active');
	} else {
		Favorites.add(current_user);
		$('#favorites_button').addClass('active');
	}
}

function beginSearch() {
	if (isSearching) { return; }

	var u=$('#query').val(), isnum = /^\d+$/.test(u);

	if ((u.length==20) && (isnum)) {
		if ($('#type').val() != 'video-lookup') {
			$('#type').val('video-lookup');
			onTypeChange();
		}
	} else if ((u.length == 18) && (isnum)) {
		if ($('#type').val() != 'user-lookup') {
			$('#type').val('user-lookup');
			onTypeChange();
		}
	} else if (u.indexOf('http') > -1) {
		if ($('#type').val() != 'url-lookup') {
			$('#type').val('url-lookup');
			onTypeChange();
		}
	} else if (u.indexOf('#') > -1) {
		if ($('#type').val() != 'hashtag') {
			$('#type').val('hashtag');
			onTypeChange();
		}
/*
	} else {
		if (($('#type').val() != 'search') || ($('#type').val() != 'hashtag')) {
			$('#type').val('search');
			onTypeChange();
		}
*/		
	}
	beginSearch2();
}

function beginSearch2() {
	if (isSearching) { return; }

	isSearching = true;
	$('#overlay').show();
	$('#main').html('');
	
	if ($('#type').val() == 'url-lookup') {
		var q = '', u=$('#query').val(), t=u.split('/');

		if (u.indexOf('/live/') > -1) {
			$('#type').val('video-lookup');
			$('#query').val(u[3]);
			setTimeout(function(){
				beginSearch2();
			}, 100);

		} else if (t[t.length-1].indexOf('yolo') > -1) {
			var a=t[t.length - 1].split('-');
			$('#type').val('video-lookup');
			$('#query').val(a[1]);
			setTimeout(function(){
				beginSearch2();
			}, 100);
			
		} else if (u.indexOf('videoid') > -1) {
			var a=t[t.length - 1].split('?'),b=a[1].split('&');
			console.log(a);
			for (i = 0; i < b.length; i++) {
				if (b[i].indexOf('videoid') > -1) {
					var c=b[i].split('=');
					
					$('#type').val('video-lookup');
					$('#query').val(c[1]);
					setTimeout(function(){
						beginSearch2();
					}, 100);

				}
			}
		} else if (u.indexOf('userid') > -1) {
			var a=t[t.length - 1].split('?'),b=a[1].split('&');
			console.log(a);
			for (i = 0; i < b.length; i++) {
				if (b[i].indexOf('userid') > -1) {
					var c=b[i].split('=');
					
					$('#type').val('user-lookup');
					$('#query').val(c[1]);
					setTimeout(function(){
						beginSearch2();
					}, 100);

				}
			}
		} else {
			$('#main').html('<div class="emptylist">Unsupported URL detected.</div>');
		}

		isSearching = false;
		$('#overlay').hide();
		
	}



	if ($('#type').val() == 'search') {
		searchkeyword($('#query').val(), function(e) {
			isSearching = false;
			$('#main').html('<div id="results" class="panel"></div>'); 
			renderSearchResults(e);
			$('#overlay').hide();
		});
	} else if ($('#type').val() == 'hashtag') {
		search_hashtag($('#query').val(), function(e) {
			isSearching = false;
			$('#main').html('<div id="videolist_full" class="panel"></div>'); 
			renderHashtagResults(e);
			$('#overlay').hide();
		});
	} else {
		getuservideos($('#query').val(), function(e){
			isSearching = false;
			if ((typeof e.userinfo.userid === "undefined") || (e.userinfo.userid == 0)) {
				$('#main').html('<div class="emptylist">Search returned nothing.</div>');
			} else {
				$('#main').html('<div id="userinfo" class="panel"></div><div id="videolist" class="panel"></div>'); 
				renderUserLookup(e);
			}
			$('#overlay').hide();
		});
	}	

}



function showUser(u) {
	$('#type').val('user-lookup');
	$('#query').val(u);
	beginSearch2();
}

function showFollowing(u,m,n) {
	if (debounced) return;
	debounced = true;
	setTimeout(function(){ debounced = false; }, 500);

	ipcRenderer.send('open-window', { url: 'following.html?'+u+'#'+m+'#'+n });
}

function showFans(u,m,n) {
	if (debounced) return;
	debounced = true;
	setTimeout(function(){ debounced = false; }, 500);

	ipcRenderer.send('open-window', { url: 'fans.html?'+u+'#'+m+'#'+n });
}


function playVideo(u) {
	if (debounced) return;
	debounced = true;
	setTimeout(function(){ debounced = false; }, 500);

	ipcRenderer.send('play-video', { url: u });
}

function downloadVideo(userid, username, videoid, videotitle, videotime, videourl) {
	if (debounced) return;
	debounced = true;
	setTimeout(function(){ debounced = false; }, 500);

	Downloads.add({
		user: {
			id: userid,
			name: username
		},
		video: {
			id: videoid,
			title: videotitle,
			time: videotime,
			url: videourl
		}
	});
}

function openChat(u, t, a) {
	if (debounced) return;
	debounced = true;
	setTimeout(function(){ debounced = false; }, 500);

	ipcRenderer.send('open-chat', { url: u, startTime: t, nickname: a });
}

function renderUserLookup(e) {

	$('#videolist').html('');

	if (typeof e === "undefined") {
		$('#videolist').html('<div class="emptylist">Search returned no data, account may be closed.</div>');
		return;
	}

	if (e.userinfo.userid == 0) {
		$('#videolist').html('<div class="emptylist">Search returned no data, account may be closed.</div>');
		return;
	}

	if (e.userinfo.userid > 0) {
		current_user = {
			uid: e.userinfo.userid,
			sex: e.userinfo.sex,
			face: e.userinfo.usericon,
			nickname: e.userinfo.username
		};

		$('#userinfo').html(`
				<img src="${e.userinfo.usericon}" class="avatar" onerror="this.src='images/blank.png'"><br>
				<h3 class="name">${e.userinfo.username}</h3>
				<label>User ID:</label><input type="text" id="useridtf" value="${e.userinfo.userid}" disabled="disabled">
				<h4>Level: ${e.userinfo.level}</h4>
				<input type="button" value="Favorite" onClick="toggleFavorite()" id="favorites_button">
				<br><br>
				<input type="button" value="Following ${e.userinfo.following}" onClick="showFollowing('${e.userinfo.userid}', ${e.userinfo.following}, '${e.userinfo.username}')">
				<input type="button" value="${e.userinfo.fans} Fans" onClick="showFans('${e.userinfo.userid}', ${e.userinfo.following}, '${e.userinfo.username}')">
				<input type="hidden" id="sex" value="${e.userinfo.sex}">
		`);
	}

	if (typeof e.videos === undefined) {
		$('#videolist').html('<div class="emptylist">No videos entries for this user account found.</div>');
		return;
	}

	if (e.videos.length == 0) {
		$('#videolist').html('<div class="emptylist">No videos entries for this user account found.</div>');
		return;
	}

	for(i = 0; i < e.videos.length; i++) {
		if (e.videos[i].url.length > 8) {

			var dt = new Date(e.videos[i].dt * 1000);
			var ds = (dt.getMonth() + 1) + '-' + dt.getDate() + '-' + dt.getFullYear() + ' ' + (dt.getHours() < 10 ? '0' : '') + dt.getHours() + ':' + (dt.getMinutes() < 10 ? '0' : '') + dt.getMinutes();
			var hi1 = $('#type').val() == 'url-lookup' ? ($('#query').val() == e.videos[i].url ? true : false) : false;
			var hi2 = $('#type').val() == 'video-lookup' ? ($('#query').val() == e.videos[i].videoid ? true : false) : false;

			var ls = (e.videos[i].length - Math.round(e.videos[i].length / 60)) % 60, lm = Math.round(e.videos[i].length / 60);
			var length = lm + ':' + (ls < 10 ? '0' : '') + ls;
			let deleted = e.videos[i].private == true ? '[DELETED] ' : '', highlight = hi1 || hi2 ? 'highlight' : '';
			let downloaded = Downloads.has_been_downloaded(e.videos[i].videoid) ? 'downloaded' : '';

			$('#videolist').append(`
				<div class="video_entry ${highlight} ${downloaded}">
					<input class="vdoid" type="text" value="${e.videos[i].videoid}"><input class="url" type="text" value="${e.videos[i].url}">
					<span class="vid">ID:</span>
					<span class="uid">URL:</span>
					<h4 class="date">${ds}</h4>
					<h4 class="title">${deleted}${e.videos[i].title}</h4>
					<div class="counts">
						<label>Length:</label><span>${length}</span>
						<label>Views:</label><span>${e.videos[i].plays}</span>
						<label>Likes:</label><span>${e.videos[i].likes}</span>
						<label>Shares:</label><span>${e.videos[i].shares}</span>
						<label>Country:</label><span>${e.videos[i].location.country}</span>
					</div>
					<img class="chat" src="images/ic_chat_white_24px.svg" onClick="openChat('${e.videos[i].msgfile}', '${e.videos[i].dt}', '${e.userinfo.username}')" title="View Message History">
					<img class="watch" src="images/ic_play_circle_outline_white_24px.svg" onClick="playVideo('${e.videos[i].url}')" title="Play Video">
					<img class="download" src="images/ic_file_download_white_24px.svg" onClick="downloadVideo('${e.userinfo.userid}', '${e.userinfo.username}', '${e.videos[i].videoid}', '${e.videos[i].title.replace("'", "")}', '${e.videos[i].dt}', '${e.videos[i].url}')" title="Download Video">
				</div>
			`);
		}
	}

	setTimeout(function(){
		if (Favorites.isOnList($('#useridtf').val()) == true) {
			$('#favorites_button').addClass('active');
		}
	}, 50);
}

function renderSearchResults(e) {
	$('#main').html('<div id="userlist"></div>');

	if (typeof(e) == "undefined") {
		return;
	}

	if (e.length < 1) {
		$('#main').html('<div class="emptylist">No users were found on LiveMe.</div>');
		return;
	}

	for(i = 0; i < e.length; i++) {
		if (e[i].userid > 0) {
			$('#userlist').append(`
				<div class="user_entry ${e[i].sex}">
					<img class="avatar" src="${e[i].face}" onerror="this.src='images/blank.png'">
					<h4>${e[i].nickname}</h4>
					<div class="userid">UserID:</div>
					<div class="level">Level: <span>${e[i].level}</span></div>
					
					<input type="button" class="fans" value="${e[i].fans} Fans" onClick="showFans('${e[i].userid}', '${e[i].fans}', '${e[i].nickname}')">
					<input type="button" class="followings" value="Following ${e[i].followings}" onClick="showFollowing('${e[i].userid}', ${e[i].followings}, '${e[i].nickname}')">
					<input type="button" class="user" value="${e[i].userid}" onClick="showUser('${e[i].userid}')">
				</div>
			`);
		}
	}
}

function renderHashtagResults(e) {

	$('#main').html('<div id="videolist_full"></div>');

	if (typeof(e) == "undefined") {
		return;
	}

	if (e.length < 1) {
		$('#main').html('<div class="emptylist">No videos were found on LiveMe matching the specified hashtag.</div>');
		return;
	}

	for(i = 0; i < e.length; i++) {
		if (e[i].videosource.length > 8) {

			var dt = new Date(e[i].vtime * 1000);
			var ds = (dt.getMonth() + 1) + '-' + dt.getDate() + '-' + dt.getFullYear() + ' ' + (dt.getHours() < 10 ? '0' : '') + dt.getHours() + ':' + (dt.getMinutes() < 10 ? '0' : '') + dt.getMinutes();
			var hi1 = $('#type').val() == 'url-lookup' ? ($('#query').val() == e[i].url ? true : false) : false;
			var hi2 = $('#type').val() == 'video-lookup' ? ($('#query').val() == e[i].vdoid ? true : false) : false;

			var ll = parseFloat(e[i].videolength), lh = Math.round(ll / 3600), lm = Math.round(ll / 60) % 60, ls = ll % 60;
			//var ls = (parseInt(e[i].videolength) - Math.round(parseInt(e[i].videolength) / 60)) % 60, lm = Math.round(parseInt(e[i].videolength) / 60);
			var length = lh + ':' + (lm < 10 ? '0' : '') + lm + ':' + (ls < 10 ? '0' : '') + ls;
			let deleted = e[i].private == true ? '[DELETED] ' : '', highlight = hi1 || hi2 ? 'highlight' : '';
			let downloaded = Downloads.has_been_downloaded(e[i].vdoid) ? 'downloaded' : '';

			$('#videolist_full').append(`
				<div class="video_entry ${highlight} ${downloaded}">
					<input class="vdoid" type="text" value="${e[i].vdoid}"><input class="url" type="text" value="${e[i].videosource}">
					<span class="vid">ID:</span>
					<span class="uid">URL:</span>
					<h4 class="date">${ds}</h4>
					<h4 class="title"><span onClick="showUser('${e[i].userid}')">${e[i].uname}</span> - ${deleted}${e[i].title}</h4>
					<div class="counts">
						<label>Length:</label><span>${length}</span>
						<label>Views:</label><span>${e[i].playnumber}</span>
						<label>Likes:</label><span>${e[i].likenum}</span>
						<label>Shares:</label><span>${e[i].sharenum}</span>
						<label>Country:</label><span>${e[i].countryCode}</span>
					</div>
					<img class="chat" src="images/ic_chat_white_24px.svg" onClick="openChat('${e[i].msgfile}', '${e[i].vtime}', '${e.uname}')" title="View Message History">
					<img class="watch" src="images/ic_play_circle_outline_white_24px.svg" onClick="playVideo('${e[i].videosource}')" title="Play Video">
					<img class="download" src="images/ic_file_download_white_24px.svg" onClick="downloadVideo('${e.userid}', '${e.uname}', '${e[i].vdoid}', '${e[i].title.replace("'", "")}', '${e[i].vtime}', '${e[i].videosource}')" title="Download Video">
				</div>
			`);
		}
	}

}
