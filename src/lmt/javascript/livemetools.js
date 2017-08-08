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

const { electron, BrowserWindow, remote, ipcRenderer } = require('electron');
const fs = require('fs');

var isSearching = false, favorites_list = [];

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

});


function showSettings() { ipcRenderer.send('show-settings'); }
function showFavorites() { ipcRenderer.send('show-favorites'); }

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



function showUpload() {
	var d = remote.dialog.showOpenDialog(
		remote.getCurrentWindow(),
		{
			properties: [
				'openFile'
			]
		}
	);

	if (typeof(d) == undefined) return;

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
					ipcRenderer.send('download-video', { url: filelist[i] });
				}
			}

		}
		
		$('#download_folder').val(settings.downloadpath);

		return;
	});




}

function toggleFavorite() {
	if ($('#favorites_button').hasClass('active')) {
		// Removing from favorites list
		var t = [];
		for (i = 0; i < favorites_list.length; i++) {
			if (favorites_list[i].uid != $('#uid').val()) {
				t.push(favorites_list[i]);
			}
		}
		favorites_list = t;
		fs.writeFile(remote.app.getPath('appData') + '/' + remote.app.getName() + '/favorites.json', JSON.stringify(favorites_list), 'utf8', function(){
			$('#favorites_button').removeClass('active');
		});
	} else {
		// Adding to Favorites List
		favorites_list.push({
			uid: $('#uid').val(),
			sex: $('#sex').val(),
			face: $('img.avatar').attr('src'),
			nickname: $('h3.name').html()
		})
		fs.writeFile(remote.app.getPath('appData') + '/' + remote.app.getName() + '/favorites.json', JSON.stringify(favorites_list), 'utf8', function(){
			$('#favorites_button').addClass('active');
		});

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
			
		} else if (t[t.length-1].indexOf('/liveme/') > -1) {
			var a=t[t.length - 1].split('.');
			q = a[0];
		} else if (t[t.length - 1].indexOf('videoid') > -1) {
			var a=t[t.length - 1].split('?'),b=a[1].split('&');
			console.log(a);
			for (i = 0; i < b.length; i++) {
				if (b[i].indexOf('videoid') > -1) {
					var c=b[i].split('=');
					q = c[1];
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
	} else {
		getuservideos($('#query').val(), function(e){
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
	ipcRenderer.send('open-window', { url: 'following.html?'+u+'#'+m+'#'+n });
}

function showFans(u,m,n) {
	ipcRenderer.send('open-window', { url: 'fans.html?'+u+'#'+m+'#'+n });
}


function playVideo(u) {
	ipcRenderer.send('play-video', { url: u });
}

function downloadVideo(u) {
	ipcRenderer.send('download-video', { url: u });
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
		var h=	'<img src="'+u.usericon+'" class="avatar" onerror="this.src=\'images/blank.png\'"><br><h3 class="name">'+u.username+'</h3><label>User ID:</label><input type="text" id="uid" value="'+u.userid+'" disabled="disabled">'+
				'<h4>Level: ' + u.level+'</h4><input type="button" value="Favorite" onClick="toggleFavorite()" id="favorites_button"><br><br><br>'+
				'<input type="button" value="Following '+u.following+'" onClick="showFollowing(\''+u.userid+'\', '+u.following+', \''+u.username+'\')">'+
				'<input type="button" value="'+u.fans+' Fans" onClick="showFans(\''+u.userid+'\', '+u.following+', \''+u.username+'\')"><input type="hidden" id="sex" value="'+u.sex+'">';
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

	var fn = remote.app.getPath('appData') + '/' + remote.app.getName() +'/favorites.json', skip = false;
	fs.readFile(fn, 'utf8', function (err,data) {
		if (err) {
			skip = true;
		} else {
			favorites_list = JSON.parse(data);
		}

		for (i = 0; i < favorites_list.length; i++) {
			if (favorites_list[i].uid == $('#uid').val()) {
				$('#favorites_button').addClass('active');
			} else {
				$('#favorites_button').removeClass('active');
			}
		}

	});

}

function renderSearchResults(e) {
	$('#main').html('<div id="userlist"></div>');

	if (typeof(e) == undefined) {
		return;
	}
	if (typeof(e) == undefined) {
		return;
	}

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


