const remote = require('electron').remote, app = remote.app, fs = require('fs');
var favorites_list = [];

$(function(){
	var fn = app.getPath('appData') + '/' + app.getName() +'/favoriates.json';
	
	fs.readFile(fn, 'utf8', function (err,data) {
		if (err) {
			favorites_list = [];
		} else {
			favorites_list = JSON.parse(data);
		}
		
		$('#small_user_list').html('');
		for (i = 0; i < favorites_list.length; i++) {
			var t = '<div title="Click to view user\'s videos." class="user_entry small clickable ' + (0 == favorites_list[i].sex ? "female" : "male") + '" onClick="getVideos(\'' + favorites_list[i].uid + '\')"><img class="avatar" src="' + favorites_list[i].face + '" onerror="this.src=\'images/blank.png\'"><h4>' + favorites_list[i].nickname + '</h4></div>';
			if ($("#small_user_list").append(t), ct + i > max) break
		}
	});
	
});



