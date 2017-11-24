/*

	  _      _           __  __        _______          _
	 | |    (_)         |  \/  |      |__   __|        | |
	 | |     ___   _____| \  / | ___     | | ___   ___ | |___
	 | |    | \ \ / / _ \ |\/| |/ _ \    | |/ _ \ / _ \| / __|
	 | |____| |\ V /  __/ |  | |  __/    | | (_) | (_) | \__ \
	 |______|_| \_/ \___|_|  |_|\___|    |_|\___/ \___/|_|___/

*/

const 	{ electron, BrowserWindow, remote, ipcRenderer, shell, clipboard } = require('electron'),
		fs = require('fs'), path = require('path'), fmtDuration = require('format-duration'),
		appSettings = remote.require('electron-settings'),
		DataManager = remote.getGlobal('DataManager'),
		DownloadManager = remote.getGlobal('DownloadManager'),
		LiveMe = require('liveme-api');

var 	debounced = false, current_user = {}, current_page = 1, has_more = false,
		current_search = '', scroll_busy = false;

$(function(){

	document.title = remote.app.getName() + ' v' + remote.app.getVersion();

	onTypeChange();

	// Remote search calls
	ipcRenderer.on('do-search' , function(event , data) {
		$('#query').val(data.userid);
		$('#type').val('user-lookup');
		beginSearch2();
	});

	ipcRenderer.on('do-shutdown' , function(event , data) {
		DownloadManager.save();
	});

	ipcRenderer.on('show-status' , function(event , data) {
		$('.status').html(data.message);
		$('overlay .status').show();
		$('overlay .ffmpeg-error').hide();
		$('overlay').show();
	});
	ipcRenderer.on('update-status' , function(event , data) {
		$('.status').html(data.message);
	});
	ipcRenderer.on('hide-status' , function(event , data) {
		$('overlay').hide();
	});

	DownloadManager.load();

	DownloadManager.detectFFMPEG().then(result => {
		if (!result) {
			$('overlay').show();
			$('overlay .status').hide();
			$('overlay .ffmpeg-error').show();
		}
	});

	$('main').scroll(function() {
		if (($(this).scrollTop() + $(this).height()) > ($('.list').height() - 80)) {
			if (has_more == false) return;
			if (scroll_busy == true) return;

			current_page++;
			if (current_search == 'getUsersReplays') {
				getUsersReplays();
			} else if (current_search == 'performUsernameSearch') {
				performUsernameSearch();
			} else if (current_search == 'performHashtagSearch') {
				performHashtagSearch();
			}
		}
	});


	const InputMenu = remote.Menu.buildFromTemplate([{
	        label: 'Undo',
	        role: 'undo',
	    }, {
	        label: 'Redo',
	        role: 'redo',
	    }, {
	        type: 'separator',
	    }, {
	        label: 'Cut',
	        role: 'cut',
	    }, {
	        label: 'Copy',
	        role: 'copy',
	    }, {
	        label: 'Paste',
	        role: 'paste',
	    }, {
	        type: 'separator',
	    }, {
	        label: 'Select all',
	        role: 'selectall',
	    },
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
	        node = node.parentNode;
	    }
	});

	/*

	countryCode search is not working even when directly tested with LiveMe API URLs and calls.
	Don't know why it quit working now so we're removing until further testing can be done.


	setTimeout(function(){
		for (var i = 0; i < cclist.length; i++) {
			$('#cclist').append('<option value="'+cclist[i][1]+'">'+cclist[i][0]+'</option>');
		}
	}, 100);
	*/
});

function copyToClipboard(i) { clipboard.writeText(i); }
function cancelAction() { cancelLMTweb = true; }
function enterOnSearch(e) { if (e.keyCode == 13) beginSearch(); }

function onTypeChange() {
	var t=$('#type').val();
	switch (t) {
		case 'user-lookup':
			$('#query').attr('placeholder', 'Short or Long UserID');
			$('div.toolbar').removeClass('has-cc-list');
			$('div.cclist').hide();
			break;
		case 'video-lookup':
			$('#query').attr('placeholder', 'Enter VideoID');
			$('div.toolbar').removeClass('has-cc-list');
			$('div.cclist').hide();
			break;
		case 'url-lookup':
			$('#query').attr('placeholder', 'Enter URL');
			$('div.toolbar').removeClass('has-cc-list');
			$('div.cclist').hide();
			break;
		case 'search':
			$('#query').attr('placeholder', 'Enter Partial or Full Username');
			$('div.toolbar').addClass('has-cc-list');
			$('div.cclist').show();
			break;
		case 'hashtag':
			$('#query').attr('placeholder', 'Enter a hashtag without any #\'s');
			$('div.toolbar').addClass('has-cc-list');
			$('div.cclist').show();
			break;
	}
}

function toggleFavorite() {
	if (DataManager.isInFavorites(current_user.uid) == true) {
		DataManager.removeFavorite(current_user.uid);
		$('#favorites_button').removeClass('active');
	} else {
		DataManager.addFavorite(current_user);
		$('#favorites_button').addClass('active');
	}
}

function beginSearch() {

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
			$('#query').val($('#query').val().replace('#', ''));
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

	if (debounced) return;
	debounced = true;
	setTimeout(function(){ debounced = false; }, 250);

	current_page = 1;

	var videoid = '', userid = '';

	$('overlay').show();
	$('main').html('');

	if ($('#type').val() == 'url-lookup') {
		var q = '', u=$('#query').val(), t=u.split('/');

		if (u.indexOf('/live/') > -1) {
			$('#type').val('video-lookup');
			$('#query').val(u[3]);
			videoid = u[3];

		} else if (t[t.length-1].indexOf('yolo') > -1) {
			var a=t[t.length - 1].split('-');
			$('#type').val('video-lookup');
			$('#query').val(a[1]);
			videoid = a[1];

		} else if (u.indexOf('videoid') > -1) {
			var a=t[t.length - 1].split('?'),b=a[1].split('&');

			for (i = 0; i < b.length; i++) {
				if (b[i].indexOf('videoid') > -1) {
					var c=b[i].split('=');

					$('#type').val('video-lookup');
					$('#query').val(c[1]);
					videoid = c[1];

				}
			}
		} else if (u.indexOf('userid') > -1) {
			var a=t[t.length - 1].split('?'),b=a[1].split('&');

			for (i = 0; i < b.length; i++) {
				if (b[i].indexOf('userid') > -1) {
					var c=b[i].split('=');

					$('#type').val('user-lookup');
					$('#query').val(c[1]);
					videoid = c[1];

				}
			}
		} else {
			$('main').html('<div class="list"><div class="empty">Unsupported URL was specified.</div></div>');
		}
		$('overlay').hide();
	} else if ($('#type').val() == 'video-lookup') {
		videoid = $('#query').val();
	} else if ($('#type').val() == 'user-lookup') {
		$('panel').hide();
		$('main').removeClass('with-panel');
		userid = $('#query').val();
	}

	$('overlay').hide();
	if (videoid.length > 0) {

		LiveMe.getVideoInfo(videoid)
			.then(video => {

				$('panel').show();
				$('main').addClass('with-panel').html('<div id="videolist" class="list"></div>');

				if (video.videosource.length < 1) {
					$('panel').hide();
					$('main').removeClass('with-panel').html('<div class="list"><div class="empty">Search returned no data, account may be closed.</div></div>');
				} else {
					let dt = new Date(video.vtime * 1000);
					var ds = (dt.getMonth() + 1) + '-' + dt.getDate() + '-' + dt.getFullYear() + ' ' + (dt.getHours() < 10 ? '0' : '') + dt.getHours() + ':' + (dt.getMinutes() < 10 ? '0' : '') + dt.getMinutes();
					var hi1 = $('#type').val() == 'url-lookup' ? ($('#query').val() == video.hlsvideosource ? true : false) : false;
					var hi2 = $('#type').val() == 'video-lookup' ? ($('#query').val() == video.vid ? true : false) : false;

					var deleted = '[SEARCHED] ', highlight = hi1 || hi2 ? 'highlight' : '';
					var downloaded = DownloadManager.hasBeenDownloaded(video.vid) ? 'downloaded' : '';

					let isLive = video.hlsvideosource.endsWith('flv') || video.hlsvideosource.indexOf('liveplay') > 0, videoUrl = video.hlsvideosource;

					if (!isLive && video.hlsvideosource.indexOf('hlslive') > 0) {
						videoUrl = video.videosource;
					}
					if (videoUrl.length < 1) isLive = true;

					var h = `
						<div class="item ${highlight} ${downloaded}">
							<div class="header">${deleted}${video.title}&nbsp;</div>
							<div class="content">
								<div class="meta">
									<div class="width180">
										<span>Posted on:</span>
										${ds}
									</div>
									<div class="width75">
										<span>Length:</span>
										${fmtDuration(+video.videolength * 1000)}
									</div>
									<div class="width100">
										<span>Views:</span>
										${video.playnumber}
									</div>
									<div class="width100">
										<span>Likes:</span>
										${video.likenum}
									</div>
									<div class="width100">
										<span>Shares:</span>
										${video.sharenum}
									</div>
									<div class="width60">
										<span>Country</span>
										${video.countryCode}
									</div>
									<div class="width200 align-right">
					`;
					if (!isLive) {
						h += `
										<a class="button icon icon-play" onClick="playVideo('${videoUrl}')" title="Play Video"></a>
										<a class="button icon icon-download" onClick="downloadVideo('${video.userid}', '${video.uname}', '${video.vid}', '${video.title.replace("'", "")}', '${video.vtime}', '${videoUrl}')" title="Download Replay"></a>
										<a class="button icon icon-chat" onClick="openChat('${video.vid}')" title="View Message History"></a>
						`;
					}
					h+=`
									</div>
								</div>
							</div>
							<div class="footer">
								<div class="width200">
									<span>Video ID:</span>
									<div class="input has-right-button">
										<input type="text" value="${video.vid}" disabled="disabled">
										<input type="button" class="icon icon-copy" value="" onClick="copyToClipboard('${video.vid}')" title="Copy to Clipboard">
									</div>
								</div>
								<div class="spacer">&nbsp;</div>
					`;
					if (videoUrl.length > 0) {
						h+=`
									<div class="width700">
										<span>Video URL:</span>
										<div class="input has-right-button">
											<input type="text" value="${videoUrl}" disabled="disabled">
											<input type="button" class="icon icon-copy" value="" onClick="copyToClipboard('${videoUrl}')" title="Copy to Clipboard">
										</div>
									</div>
						`;
						}
					h += `
							</div>
						</div>
					`;
					$('.list').append(h);
					performUserLookup(video.userid);
				}
			});

	} else if (userid.length > 0) {
		$('panel').hide();
		$('main').addClass('with-panel').html('<div id="videolist" class="list"></div>');
		performUserLookup(userid);
	} else {
		if ($('#type').val() == 'search') {
			$('main').html('<div id="userlist" class="list"></div>');
			performUsernameSearch();
		} else if ($('#type').val() == 'hashtag') {
			$('main').html('<div id="userlist" class="list"></div>');
			performHashtagSearch();
		}
	}
}

function performUserLookup(uid) {
	$('overlay').hide();
	$('panel').show();

	LiveMe.getUserInfo(uid)
		.then(user => {

			var sex = user.user_info.sex < 0 ? '' : (user.user_info.sex == 0 ? 'female' : 'male'),
				dt = Math.floor(new Date().getTime() / 1000) + parseInt(appSettings.get('profiles.visitedtimeout'));

			DataManager.addTrackedVisited({ id: user.user_info.uid, dt: dt });

			$('.user-panel').html(`
				<img class="avatar" src="${user.user_info.face}" onerror="this.src='images/blank.png'">
				<div class="meta">
					<div>
						<span>Username:</span>
						${user.user_info.uname}
					</div>
					<div class="align-center">
						<span>User ID:</span>
						<div class="input has-right-button width180">
							<input type="text" id="useridtf" value="${user.user_info.uid}" disabled="disabled">
							<input type="button" class="icon icon-copy" value="" onClick="copyToClipboard('${user.user_info.uid}')" title="Copy to Clipboard">
						</div>
					</div>
					<div>
						<span>Level:</span>
						${user.user_info.level}
					</div>
					<div>
						<br><br>
						<input type="button" class="toggle tiny tiny-100" value="Favorite" onClick="toggleFavorite()" id="favorites_button">
						<br><br><br>
					</div>
					<div>
						<span>Following:</span>
						<input type="button" class="tiny tiny-100" value="${user.count_info.following_count}" onClick="showFollowing('${user.user_info.uid}', ${user.count_info.following_count}, '${user.user_info.uname}')">
					</div>
					<div>
						<span>Fans:</span>
						<input type="button" class="tiny tiny-100" value="${user.count_info.follower_count}" onClick="showFans('${user.user_info.uid}', ${user.count_info.follower_count}, '${user.user_info.uname}')">
					</div>
				</div>
				<input type="hidden" id="sex" value="${sex}">
			`);


			scroll_busy = false;
			current_page = 1;

			current_user = {
				uid: user.user_info.uid,
				sex: sex,
				face: user.user_info.face,
				nickname: user.user_info.uname
			};
			getUsersReplays();

			setTimeout(function(){
				if (DataManager.isInFavorites(current_user.uid) == true) {
					$('#favorites_button').addClass('active');
				}
			}, 250);

		})
		.catch(err => {
			isSearching = false;
			$('main').html('<div class="list"><div class="empty">Search returned no data, account may be closed.</div>');
		});

}

function getUsersReplays() {

	LiveMe.getUserReplays(current_user.uid, current_page, 10)
		.then(replays => {

			if ((typeof replays == 'undefined') || (replays == null)) return;

			if (replays.length > 0) {

				$('.empty').remove();

				for (var i = 0; i < replays.length; i++) {

					if (current_user.uid == replays[i].userid) {

						let dt = new Date(replays[i].vtime * 1000);
						var ds = (dt.getMonth() + 1) + '-' + dt.getDate() + '-' + dt.getFullYear() + ' ' + (dt.getHours() < 10 ? '0' : '') + dt.getHours() + ':' + (dt.getMinutes() < 10 ? '0' : '') + dt.getMinutes();
						var hi1 = $('#type').val() == 'url-lookup' ? ($('#query').val() == replays[i].hlsvideosource ? true : false) : false;
						var hi2 = $('#type').val() == 'video-lookup' ? ($('#query').val() == replays[i].vid ? true : false) : false;

						var deleted = replays[i].private == true ? '[PRIVATE] ' : '', highlight = hi1 || hi2 ? 'highlight' : '';
						var downloaded = DownloadManager.hasBeenDownloaded(replays[i].vid) ? 'downloaded' : '';

						let isLive = replays[i].hlsvideosource.endsWith('flv') || replays[i].hlsvideosource.indexOf('liveplay') > 0, videoUrl = replays[i].hlsvideosource;

						if (!isLive && replays[i].hlsvideosource.indexOf('hlslive') > 0) {
							videoUrl = replays[i].videosource;
						}

						var h = `
							<div class="item ${highlight} ${downloaded}">
								<div class="header">${deleted}${replays[i].title}&nbsp;</div>
								<div class="content">
									<div class="meta">
										<div class="width180">
											<span>Posted on:</span>
											${ds}
										</div>
										<div class="width75">
											<span>Length:</span>
											${fmtDuration(+replays[i].videolength * 1000)}
										</div>
										<div class="width100">
											<span>Views:</span>
											${replays[i].playnumber}
										</div>
										<div class="width100">
											<span>Likes:</span>
											${replays[i].likenum}
										</div>
										<div class="width100">
											<span>Shares:</span>
											${replays[i].sharenum}
										</div>
										<div class="width60">
											<span>Country</span>
											${replays[i].countryCode}
										</div>
										<div class="width200 align-right">
											<a class="button icon icon-play" onClick="playVideo('${videoUrl}')" title="Play Video"></a>
							`;

						if (!isLive) {
							h += `
											<a class="button icon icon-chat" onClick="openChat('${replays[i].vid}')" title="View Message History"></a>
											<a class="button icon icon-download" onClick="downloadVideo('${replays[i].userid}', '${replays[i].uname}', '${replays[i].vid}', '${replays[i].title.replace("'", "")}', '${replays[i].vtime}', '${videoUrl}')" title="Download Replay"></a>
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
											<input type="text" value="${replays[i].vid}" disabled="disabled">
											<input type="button" class="icon icon-copy" value="" onClick="copyToClipboard('${replays[i].vid}')" title="Copy to Clipboard">
										</div>
									</div>
									<div class="spacer">&nbsp;</div>
						`;
						if (videoUrl.length > 0) {
							h+=`
										<div class="width700">
											<span>Video URL:</span>
											<div class="input has-right-button">
												<input type="text" value="${videoUrl}" disabled="disabled">
												<input type="button" class="icon icon-copy" value="" onClick="copyToClipboard('${videoUrl}')" title="Copy to Clipboard">
											</div>
										</div>
							`;
							}
						h += `
								</div>
							</div>
						`;
						$('.list').append(h);
					}
				}
			}

			current_search = 'getUsersReplays';
			scroll_busy = false;

			if (replays.length == 10) {
				has_more = true;
			} else if (replays.length < 10) {
				has_more = false;
			}

			setTimeout(function(){
				if ($('.item').length < 1) {
					$('.list').html('<div class="empty">No visible replays available for this account.</div>');
				}
			}, 1000);

		});

}

function performUsernameSearch() {
	LiveMe.performSearch($('#query').val(), current_page, 10, 1)
		.then(results => {
			for(var i = 0; i < results.length; i++) {
				$('.list').append(`
					<div class="item">
						<div class="avatar">
							<img src="${results[i].face}" onerror="this.src='images/blank.png'">
						</div>
						<div class="content">
							<div class="header">${results[i].nickname}&nbsp;</div>
							<div class="meta">
								<div class="width100">
									<span>Level:</span>
									${results[i].level}
								</div>
								<div class="width200">
									<span>User ID:</span>
									<input type="button" class="tiny tiny-160" value="${results[i].user_id}" onClick="showUser('${results[i].user_id}')">
								</div>
								<div class="width100">
									<span>Fans:</span>
									<input type="button" class="tiny tiny-100" value="${results[i].follower_count}" onClick="showFans('${results[i].user_id}', '${results[i].follower_count}', '${results[i].nickname}')">
								</div>
							</div>
						</div>
					</div>
				`);
			}

			current_search = 'performUsernameSearch';
			scroll_busy = false;

			if (results.length == 10) {
				has_more = true;
			} else if (results.length < 10) {
				has_more = false;
			}

			if (results.length == 0 && current_page == 1) {
				$('.list').html('<div class="empty">No accounts were found matching your search.</div>');
			}

		});
}

function performHashtagSearch() {
	LiveMe.performSearch($('#query').val(), current_page, 10, 2)
		.then(results => {
			for(var i = 0; i < results.length; i++) {

				var dt = new Date(results[i].vtime * 1000);
				var ds = (dt.getMonth() + 1) + '-' + dt.getDate() + '-' + dt.getFullYear() + ' ' + (dt.getHours() < 10 ? '0' : '') + dt.getHours() + ':' + (dt.getMinutes() < 10 ? '0' : '') + dt.getMinutes();
				var hi1 = $('#type').val() == 'url-lookup' ? ($('#query').val() == results[i].hlsvideosource ? true : false) : false;
				var hi2 = $('#type').val() == 'video-lookup' ? ($('#query').val() == results[i].vid ? true : false) : false;

				var downloaded = DownloadManager.hasBeenDownloaded(results[i].vid) ? 'downloaded' : '';

				let isLive = results[i].hlsvideosource.endsWith('flv') || results[i].hlsvideosource.indexOf('liveplay') > 0, videoUrl = results[i].hlsvideosource;

				if (!isLive && results[i].hlsvideosource.indexOf('hlslive') > 0) {
					videoUrl = results[i].videosource;
				}

				var h = `

					<div class="item ${downloaded}">
						<div class="header">${results[i].title}&nbsp;</div>
						<div class="content">
							<div class="meta">
								<div class="width180">
									<span>Posted on:</span>
									${ds}
								</div>
								<div class="width75">
									<span>Length:</span>
									${fmtDuration(+results[i].videolength * 1000)}
								</div>
								<div class="width100">
									<span>Views:</span>
									${results[i].playnumber}
								</div>
								<div class="width100">
									<span>Likes:</span>
									${results[i].likenum}
								</div>
								<div class="width100">
									<span>Shares:</span>
									${results[i].sharenum}
								</div>
								<div class="width60">
									<span>Country</span>
									${results[i].countryCode}
								</div>
								<div class="width200 align-right">
									<a class="button icon icon-play" onClick="playVideo('${videoUrl}')" title="Play Video"></a>
					`;
				if (!isLive) {
					h += `
									<a class="button icon icon-chat" onClick="openChat('${results[i].vid}')" title="View Message History"></a>
									<a class="button icon icon-download" onClick="downloadVideo('${results[i].userid}', '${results.uname}', '${results[i].vid}', '${results[i].title.replace("'", "")}', '${results[i].vtime}', '${videoUrl}')" title="Download Replay"></a>
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
									<input type="text" value="${results[i].vid}" disabled="disabled">
									<input type="button" class="icon icon-copy" value="" onClick="copyToClipboard('${results[i].vid}')" title="Copy to Clipboard">
								</div>
							</div>
							<div class="spacer">&nbsp;</div>
							<div class="width700">
								<span>Video URL:</span>
								<div class="input has-right-button">
									<input type="text" value="${videoUrl}" disabled="disabled">
									<input type="button" class="icon icon-copy" value="" onClick="copyToClipboard('${videoUrl}')" title="Copy to Clipboard">
								</div>
							</div>
						</div>
					</div>
				`;

				$('.list').append(h);

			}

			current_search = 'performHashtagSearch';
			scroll_busy = false;

			if (results.length == 10) {
				has_more = true;
			} else if (results.length < 10) {
				has_more = false;
			}

			if (results.length == 0 && current_page == 1) {
				$('.list').html('<div class="empty">No videos were found on LiveMe matching the specified hashtag.</div>');
			}

		});
}

function showSettings() {
	ipcRenderer.send('show-settings');
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

	DownloadManager.add({
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

function openChat(id) {
	if (debounced) return;
	debounced = true;
	setTimeout(function(){ debounced = false; }, 500);
	ipcRenderer.send('open-chat', { videoid: id });
}
