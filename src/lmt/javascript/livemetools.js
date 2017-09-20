/*

	  _      _           __  __        _______          _     
	 | |    (_)         |  \/  |      |__   __|        | |    
	 | |     ___   _____| \  / | ___     | | ___   ___ | |___ 
	 | |    | \ \ / / _ \ |\/| |/ _ \    | |/ _ \ / _ \| / __|
	 | |____| |\ V /  __/ |  | |  __/    | | (_) | (_) | \__ \
	 |______|_| \_/ \___|_|  |_|\___|    |_|\___/ \___/|_|___/

*/

const 	{ electron, BrowserWindow, remote, ipcRenderer, shell, clipboard } = require('electron'),
		fs = require('fs'), path = require('path'), 
		appSettings = remote.require('electron-settings'),
		Favorites = remote.getGlobal('Favorites'),
		Downloads = remote.getGlobal('Downloader');

var isSearching = false, favorites_list = [], debounced = false, current_user = {};

$(function(){

	document.title = remote.app.getName() + ' v' + remote.app.getVersion();

	onTypeChange();

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
        Downloads.killActiveDownload();
	});

	//Favorites.load();
	Downloads.load();
});



function showMainMenu() {

	const MainAppMenu = remote.Menu.buildFromTemplate(
		[
			{
				label: 'Import',
				submenu: [
					{
						label: 'URL List',
						click: () => showImportURLList()
					},
					{
						label: 'VideoID List',
						click: () => showImportVideoIDList()
					}
				]
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
				label: 'Help',
				submenu: [
					{
						label: 'Online Help',
						click: () => openExternal('https://github.com/thecoder75/liveme-tools/blob/master/docs/index.md')
					},
					{
						type: 'separator'
					},
					{
						label: 'Github Home',
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
						role: 'toggledevtools'
					}
				]
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

function copyToClipboard(i) { clipboard.writeText(i); }
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


function showImportVideoIDList() {
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
			var t = data.split('\n'), idlist = [], i = 0;
			
			for (i = 0; i < t.length; i++)
				idlist.push(t[i].trim());

			ipcRenderer.send('show-import-win', { list: idlist });
		}
		
		return;
	});

}



function showImportURLList() {
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
/*
	} else if (u.indexOf('#') > -1) {
		if ($('#type').val() != 'hashtag') {
			$('#type').val('hashtag');
			onTypeChange();
		}
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
	$('overlay').show();
	$('main').html('');
	
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
			
			
			/*

				!! NEED TO MAKE BETTER ERROR BOX !!

			*/
			$('main').html('<div class="list"><div class="empty">Unsupported URL detected.</div></div>');


		}

		isSearching = false;
		$('overlay').hide();
		
	}



	if ($('#type').val() == 'search') {
		searchkeyword($('#query').val(), function(e) {
			isSearching = false;
			$('main').html('<div id="results" class="list"></div>'); 
			renderSearchResults(e);
			$('overlay').hide();
		});
	} else if ($('#type').val() == 'hashtag') {
		search_hashtag($('#query').val(), function(e) {
			isSearching = false;
			$('main').html('<div id="videolist_full" class="panel"></div>'); 
			renderHashtagResults(e);
			$('overlay').hide();
		});
	} else {
		getuservideos($('#query').val(), function(e){
			isSearching = false;
			if ((typeof e.userinfo.userid === "undefined") || (e.userinfo.userid == 0)) {
				$('main').html('<div class="list"><div class="empty">Search returned nothing.</div></div>');
			} else {
				$('main').html('<div id="videolist" class="panel"></div>'); 
				renderUserLookup(e);
			}
			$('overlay').hide();
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

	$('panel').show();
	$('#main').addClass('with-panel').html('<div id="videolist" class="list"></div>');


	if (typeof e === "undefined") {
		$('.list').html('<div class="empty">Search returned no data, account may be closed.</div>');
		return;
	}

	if (e.userinfo.userid == 0) {
		$('.list').html('<div class="empty">Search returned no data, account may be closed.</div>');
		return;
	}

	if (e.userinfo.userid > 0) {
		current_user = {
			uid: e.userinfo.userid,
			sex: e.userinfo.sex,
			face: e.userinfo.usericon,
			nickname: e.userinfo.username
		};

		$('.user-panel').html(`
			<img class="avatar" src="${e.userinfo.usericon}" onerror="this.src='images/blank.png'">
			<div class="meta">
				<div>
					<span>Username:</span>
					${e.userinfo.username}
				</div>
				<div class="align-center">
					<span>User ID:</span>
					<div class="input has-right-button width180">
						<input type="text" id="useridtf" value="${e.userinfo.userid}" disabled="disabled">
						<input type="button" class="icon icon-copy" value="" onClick="copyToClipboard('${e.userinfo.userid}')" title="Copy to Clipboard">
					</div>
				</div>
				<div>
					<span>Level:</span>
					${e.userinfo.level}
				</div>
				<div>
					<br><br>
					<input type="button" class="toggle tiny tiny-100" value="Favorite" onClick="toggleFavorite()" id="favorites_button">
					<br><br><br>
				</div>
				<div>
					<span>Following:</span>
					<input type="button" class="tiny tiny-100" value="${e.userinfo.following}" onClick="showFollowing('${e.userinfo.userid}', ${e.userinfo.following}, '${e.userinfo.username}')">
				</div>
				<div>
					<span>Fans:</span>
					<input type="button" class="tiny tiny-100" value="${e.userinfo.fans}" onClick="showFans('${e.userinfo.userid}', ${e.userinfo.following}, '${e.userinfo.username}')">
				</div>
			</div>
			<input type="hidden" id="sex" value="${e.userinfo.sex}">
		`);

		setTimeout(function(){
			if (Favorites.isOnList($('#useridtf').val()) == true) {
				$('#favorites_button').addClass('active');
			}
		}, 250);

	}

	if (typeof e.videos === undefined) {
		$('#videolist').html('<div class="empty">No videos entries for this user account found.</div>');
		return;
	}

	if (e.videos.length == 0) {
		$('#videolist').html('<div class="empty">No videos entries for this user account found.</div>');
		return;
	}

	for(i = 0; i < e.videos.length; i++) {
		if (e.videos[i].url.length > 8) {

			let dt = new Date(e.videos[i].dt * 1000);
			var ds = (dt.getMonth() + 1) + '-' + dt.getDate() + '-' + dt.getFullYear() + ' ' + (dt.getHours() < 10 ? '0' : '') + dt.getHours() + ':' + (dt.getMinutes() < 10 ? '0' : '') + dt.getMinutes();
			var hi1 = $('#type').val() == 'url-lookup' ? ($('#query').val() == e.videos[i].url ? true : false) : false;
			var hi2 = $('#type').val() == 'video-lookup' ? ($('#query').val() == e.videos[i].videoid ? true : false) : false;

			var ls = (e.videos[i].length - Math.round(e.videos[i].length / 60)) % 60, lm = Math.round(e.videos[i].length / 60);
			var length = lm + ':' + (ls < 10 ? '0' : '') + ls;
			var deleted = e.videos[i].private == true ? '[PRIVATE] ' : '', highlight = hi1 || hi2 ? 'highlight' : '';
			var downloaded = Downloads.hasBeenDownloaded(e.videos[i].videoid) ? 'downloaded' : '';

			var h = `
				<div class="item ${highlight} ${downloaded}">
					<div class="header">${deleted}${e.videos[i].title}&nbsp;</div>
					<div class="content">
						<div class="meta">
							<div class="width150">
								<span>Posted on:</span>
								${ds}
							</div>
							<div class="width100">
								<span>Length:</span>
								${length}
							</div>
							<div class="width100">
								<span>Views:</span>
								${e.videos[i].plays}
							</div>
							<div class="width100">
								<span>Likes:</span>
								${e.videos[i].likes}
							</div>
							<div class="width100">
								<span>Shares:</span>
								${e.videos[i].shares}
							</div>
							<div class="width60">
								<span>Country</span>
								${e.videos[i].location.country}
							</div>
							<div class="width300 align-right">
								<a class="button icon icon-play" onClick="playVideo('${e.videos[i].url}')" title="Play Video"></a>
				`;
			if (e.videos[i].url.indexOf('liveplay') < 0 && e.videos[i].url.indexOf('hlslive') < 0) {
				h += `
								<a class="button icon icon-chat" onClick="openChat('${e.videos[i].msgfile}', '${e.videos[i].dt}', '${e.userinfo.username}')" title="View Message History"></a>
								<a class="button icon icon-download" onClick="downloadVideo('${e.userinfo.userid}', '${e.userinfo.username}', '${e.videos[i].videoid}', '${e.videos[i].title.replace("'", "")}', '${e.videos[i].dt}', '${e.videos[i].url}')" title="Download Replay"></a>
				`;
			}
				
			h += `
							</div>
						</div>
					</div>
					<div class="footer">
						<div class="width200">
							<span>Video ID:</span>
							<div class="input has-right-button">
								<input type="text" value="${e.videos[i].videoid}" disabled="disabled">
								<input type="button" class="icon icon-copy" value="" onClick="copyToClipboard('${e.videos[i].videoid}')" title="Copy to Clipboard">
							</div>
						</div>
						<div class="spacer">&nbsp;</div>
						<div class="width700">
							<span>Video URL:</span>
							<div class="input has-right-button">
								<input type="text" value="${e.videos[i].url}" disabled="disabled">
								<input type="button" class="icon icon-copy" value="" onClick="copyToClipboard('${e.videos[i].url}')" title="Copy to Clipboard">
							</div>
						</div>
					</div>
				</div>
			`;

			$('#videolist').append(h);
		}
	}

}

function renderSearchResults(e) {
	$('main').html('<div id="userlist" class="list"></div>');

	if (typeof(e) == "undefined") {
		return;
	}

	if (e.length < 1) {
		$('.list').html('<div class="empty">No users were found on LiveMe.</div>');
		return;
	}

	for(i = 0; i < e.length; i++) {
		if (e[i].userid > 0) {
			$('#userlist').append(`

				<div class="item">
					<div class="avatar">
						<img src="${e[i].face}" onerror="this.src='images/blank.png'">
					</div>
					<div class="content">
						<div class="header">${e[i].nickname}&nbsp;</div>
						<div class="meta">
							<div class="width100">
								<span>Level:</span>
								${e[i].level}
							</div>
							<div class="width200">
								<span>User ID:</span>
								<input type="button" class="tiny tiny-160" value="${e[i].userid}" onClick="showUser('${e[i].userid}')">
							</div>
							<div class="width100">
								<span>Fans:</span>
								<input type="button" class="tiny tiny-100" value="${e[i].fans}" onClick="showFans('${e[i].userid}', '${e[i].fans}', '${e[i].nickname}')">
							</div>
							<div class="width100">
								<span>Following:</span>
								<input type="button" class="tiny tiny-100" value="${e[i].followings}" onClick="showFollowing('${e[i].userid}', ${e[i].followings}, '${e[i].nickname}')">								
							</div>
						</div>
					</div>
				</div>
			`);
		}
	}
}

function renderHashtagResults(e) {

	$('main').html('<div id="videolist" class="list"></div>');

	if (typeof(e) == "undefined") {
		return;
	}

	if (e.length < 1) {
		$('.list').html('<div class="empty">No videos were found on LiveMe matching the specified hashtag.</div>');
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
			var deleted = e[i].private == true ? '[PRIVATE] ' : '', highlight = hi1 || hi2 ? 'highlight' : '';
			var downloaded = Downloads.hasBeenDownloaded(e[i].vdoid) ? 'downloaded' : '';

			var h = `

				<div class="item ${highlight} ${downloaded}">
					<div class="header">${deleted}${e[i].title}&nbsp;</div>
					<div class="content">
						<div class="meta">
							<div class="width150">
								<span>Posted on:</span>
								${ds}
							</div>
							<div class="width100">
								<span>Length:</span>
								${length}
							</div>
							<div class="width100">
								<span>Views:</span>
								${e[i].playnumber}
							</div>
							<div class="width100">
								<span>Likes:</span>
								${e[i].likenum}
							</div>
							<div class="width100">
								<span>Shares:</span>
								${e[i].sharenum}
							</div>
							<div class="width60">
								<span>Country</span>
								${e[i].countryCode}
							</div>
							<div class="width300 align-right">
								<a class="button icon icon-play" onClick="playVideo('${e[i].videosource}')" title="Play Video"></a>
				`;
			if (e[i].videosource.indexOf('liveplay') < 0 && e[i].videosource.indexOf('hlslive') < 0) {
				h += `
								<a class="button icon icon-chat" onClick="openChat('${e[i].msgfile}', '${e[i].vt}', '${e.uname}')" title="View Message History"></a>
								<a class="button icon icon-download" onClick="downloadVideo('${e.userid}', '${e.uname}', '${e[i].vdoid}', '${e[i].title.replace("'", "")}', '${e[i].vt}', '${e[i].videosource}')" title="Download Replay"></a>
				`;
			}
				
			h += `
							</div>
						</div>
					</div>
					<div class="footer">
						<div class="width200">
							<span>Video ID:</span>
							<div class="input has-right-button">
								<input type="text" value="${e[i].vdoid}" disabled="disabled">
								<input type="button" class="icon icon-copy" value="" onClick="copyToClipboard('${e[i].vdoid}')" title="Copy to Clipboard">
							</div>
						</div>
						<div class="spacer">&nbsp;</div>
						<div class="width700">
							<span>Video URL:</span>
							<div class="input has-right-button">
								<input type="text" value="${e[i].videosource}" disabled="disabled">
								<input type="button" class="icon icon-copy" value="" onClick="copyToClipboard('${e[i].videosource}')" title="Copy to Clipboard">
							</div>
						</div>
					</div>
				</div>
			`;

			$('#videolist').append(h);
		}
	}

}
