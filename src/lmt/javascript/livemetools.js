/*

	  _      _           __  __        _______          _     
	 | |    (_)         |  \/  |      |__   __|        | |    
	 | |     ___   _____| \  / | ___     | | ___   ___ | |___ 
	 | |    | \ \ / / _ \ |\/| |/ _ \    | |/ _ \ / _ \| / __|
	 | |____| |\ V /  __/ |  | |  __/    | | (_) | (_) | \__ \
	 |______|_| \_/ \___|_|  |_|\___|    |_|\___/ \___/|_|___/

													v3.0.0
		
		(c)2017 by TheCoder - Licensed under GPL3 now


*/

const {app, ipcRenderer, Menu, browserWindow, remote } = require('electron'), ipc = ipcRenderer;
const lmt = require('./livemetoolsmodule');
 
var isSearching = false;

$(function(){

	$('header h1 small').html(remote.app.getVersion());

	onTypeChange();

	// Custom popup menu for text fields
	const InputMenu = Menu.buildFromTemplate([{
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

	const InputMenu2 = Menu.buildFromTemplate([{
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
	ipc.on('do-search' , function(event , data) { 
		if (isSearching) return;

		$('#query').val(data.userid);
		$('#type').val('user-lookup');
		beginSearch2();
	});

});

function closeApp() { window.close(); }
function enterOnSearch(e) { if (e.keyCode == 13) beginSearch(); } 

function onTypeChange() {
	var t=$('#type').val();
	switch (t) {
		case 'user-lookup': $('#query').attr('placeholder', 'Short or Long UserID'); $('#maxlevel').hide(); break;
		case 'video-lookup': $('#query').attr('placeholder', 'Enter VideoID'); $('#maxlevel').hide(); break;
		case 'url-lookup': $('#query').attr('placeholder', 'Enter URL'); $('#maxlevel').hide(); break;
		case 'search': $('#query').attr('placeholder', 'Enter Partial or Full Username'); $('#maxlevel').show(); break;
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
	} else {
		if ($('#type').val() != 'search') {
			$('#type').val('search');
			onTypeChange();
		}
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

		if (t[t.length-1].indexOf('yolo') > -1) {
			var a=t[t.length - 1].split('-');
			q = a[1];
		} else if (t[t.length-1].indexOf('/liveme/') > -1) {
			var a=t[t.length - 1].split('.');
			q = a[0];
		} else if (t[t.length - 1].indexOf('videoid') > -1) {
			var a=t[t.length - 1].split('?'),b=a[1].split('&');
			for (i = 0; i < b.length; i++) {
				if (b[i].indexOf('videoid') > -1) {
					var c=b[i].split('=');
					q = c[1];
				}
			}
		} else {
			q = 'Unsupported URL';
		}
	}

	if ($('#type').val() == 'search') {
		lmt.searchkeyword($('#query').val(), function(e) {
			isSearching = false;
			$('#main').html('<div id="results" class="panel"></div>'); 
			renderSearchResults(e.data);
			$('#overlay').hide();
		});
	} else {
		lmt.getuservideos($('#query').val(), function(e){
			isSearching = false;
			if ((typeof(e.userinfo.userid) === undefined) || (e.userinfo.userid == 0)) {
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
	ipc.send('open-window', { url: 'following.html?'+u+'#'+m+'#'+n });
}

function showFans(u,m,n) {
	ipc.send('open-window', { url: 'fans.html?'+u+'#'+m+'#'+n });
}


function playVideo(u) {
	ipc.send('play-video', { url: u });
}

function downloadVideo(u) {
	ipc.send('download-video', { url: u });
}

function setDownloadFolder(f) {
	ipc.send('set-dlfolder', { folder: f });
}

function renderUserLookup(e) {

	$('#videolist').html('');

	if (e === undefined) {
		$('#videolist').html('<div class="emptylist">Search returned no data, account may be closed.</div>');
		return;
	}

	if (e.userinfo.userid == 0) {
		$('#videolist').html('<div class="emptylist">Search returned no data, account may be closed.</div>');
		return;
	}

	if (e.userinfo.userid > 0) {
		var u = e.userinfo;
		userID = u.userid;
		var h=	'<img src="'+u.usericon+'" class="avatar" onerror="this.src=\'images/blank.png\'"><br><h3 class="name">'+u.username+'</h3><label>User ID:</label><input type="text" value="'+u.userid+'">'+
				'<h4>Level: ' + u.level+'</h4><input type="button" value="Following '+u.following+'" onClick="showFollowing(\''+u.userid+'\', '+u.following+', \''+u.username+'\')">'+
				'<input type="button" value="'+u.fans+' Fans" onClick="showFans(\''+u.userid+'\', '+u.following+', \''+u.username+'\')">';
		$('#userinfo').html(h);
	}

	if (e.videos === undefined) {
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

			var h = '<div class="video_entry '+(hi1 ? 'highlight ' : '')+(hi2 ? 'highlight ' : '')+'">';
			h += '<input class="url" type="text" value="'+e.videos[i].url+'"><h4 class="date">'+ds+'</h4><h4 class="title">'+(e.videos[i].private==true ? '[DELETED] ':'')+e.videos[i].title+'</h4>';

			h += '<div class="counts"><label>Length:</label><span>'+length+'</span><label>Views:</label><span>' + e.videos[i].plays + '</span><label>Likes:</label><span>' + e.videos[i].likes + '</span><label>Shares:</label><span>' + e.videos[i].shares + '</span><label>Country:</label><span>'+e.videos[i].location.country+'</span></div>';
			h += '<img class="watch" src="images/ic_play_circle_outline_white_24px.svg" onClick="playVideo(\''+e.videos[i].url+'\')">';
			h += '<img class="download" src="images/ic_file_download_white_24px.svg" onClick="downloadVideo(\''+e.videos[i].url+'\')">';
			h += '</div>';
			$('#videolist').append(h);
		}
	}
}

function renderSearchResults(e) {
	$('#main').html('<div id="userlist"></div>');

	console.log('Got ' + e.length + ' results');

	if (e.length < 1) {
		$('#main').html('<div class="emptylist">No users were found on LiveMe.</div>');
		return;
	}

	for(i = 0; i < e.length; i++) {
		if (e[i].userid > 0) {
			var h = '<div class="user_entry '+e[i].sex+'"><img class="avatar" src="'+e[i].thumb+'"><h4>'+e[i].nickname+'</h4><div class="userid">UserID:</div><div class="level">Level: <span>'+e[i].level+'</span></div>';
			h += '<input type="button" class="fans" value="'+e[i].fans+' Fans" onClick="showFans(\''+e[i].userid+'\', '+e[i].fans+', \''+e[i].nickname+'\')">';
			h += '<input type="button" class="followings" value="Following '+e[i].followings+'" onClick="showFollowing(\''+e[i].userid+'\', '+e[i].followings+', \''+e[i].nickname+'\')">';
			h += '<input type="button" class="user" value="'+e[i].userid+'" onClick="showUser(\''+e[i].userid+'\')">';

			if (e[i].videos.length > 0) {
				h += '<input type="button" class="videos" value="'+e[i].videos.length+( e[i].videosplus == true ? '+' : '')+' Videos" onClick="$(\'.vl-'+e[i].userid+'\').toggle()"></div><div class="video_list vl-'+e[i].userid+'">';

				if (e[i].videosplus == true) {
					h += '<h4 style="text-align: center;">First 10 videos listed only!</h4>';
				}

				for(j = 0; j < e[i].videos.length; j++) {
					if (e[i].videos[j].url.length > 8) {
						var dt = new Date(e[i].videos[j].dt * 1000);
						var ds = (dt.getMonth() + 1) + '-' + dt.getDate() + '-' + dt.getFullYear() + ' ' + (dt.getHours() < 10 ? '0' : '') + dt.getHours() + ':' + (dt.getMinutes() < 10 ? '0' : '') + dt.getMinutes();

						var ls = (e[i].videos[j].length - Math.round(e[i].videos[j].length / 60)) % 60, lm = Math.round(e[i].videos[j].length / 60);
						var length = lm + ':' + (ls < 10 ? '0' : '') + ls;

						var hh = '<div class="video_entry">';
						hh += '<input class="url" type="text" value="'+e[i].videos[j].url+'"><h4 class="date">'+ds+'</h4><h4 class="title">'+(e[i].videos[j].private==true ? '[DELETED] ':'')+e[i].videos[j].title+'</h4>';

						hh += '<div class="counts"><label>Length:</label><span>'+length+'</span><label>Views:</label><span>' + e[i].videos[j].plays + '</span><label>Likes:</label><span>' + e[i].videos[j].likes + '</span><label>Shares:</label><span>' + e[i].videos[j].shares + '</span><label>Country:</label><span>'+e[i].videos[j].location.country+'</span></div>';
						hh += '<img class="watch" src="images/ic_play_circle_outline_white_24px.svg" onClick="playVideo(\''+e[i].videos[j].url+'\')">';
						hh += '<img class="download" src="images/ic_file_download_white_24px.svg" onClick="downloadVideo(\''+e[i].videos[j].url+'\')">';
						hh += '</div>';
						
						h += hh;
					}
				}

				h += '</div>';
			}

			$('#userlist').append(h);
		}
	}
}


