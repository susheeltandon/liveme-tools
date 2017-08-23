/*
	Favorites Module
*/
"use strict";

const	fs = require('fs'), {remote, ipcRenderer} = require('electron'), path = require('path');

var fav_list = [], last_change = 0, is_saved = false, index = 0;

module.exports = {

	add : function(e) {
		fav_list.push(e);
		ipcRenderer.send('favorites-refresh');
		write_to_file(false);		
	},

	remove: function(e) {
		var idx = 0;
		for (var i = 0; i < fav_list.length; i++) {
			if (fav_list[i].uid == e) {
				fav_list.splice(i, 1);
			}
		}
		ipcRenderer.send('favorites-refresh');
		write_to_file(false);
	},

	save: function() {
		ipcRenderer.send('favorites-refresh');
		write_to_file(false);
	},

	recall : function(cb) { 
		fs.readFile(path.join(remote.app.getPath('appData'), remote.app.getName(), 'favorites.json'), 'utf8', function (err,data) {
			if (err) {
				fav_list = [];
			} else {
				fav_list = JSON.parse(data);
				last_change = new Date().getTime() / 1000;
				cb(fav_list);
			}
		});
	},

	load: function() {
		fs.readFile(path.join(remote.app.getPath('appData'), remote.app.getName(), 'favorites.json'), 'utf8', function (err,data) {
			if (err) {
				fav_list = [];
			} else {
				fav_list = JSON.parse(data);
				ipcRenderer.send('favorites-refresh');
			}
		});

	},

	isOnList: function(e) {
		for (var i = 0; i < fav_list.length; i++) {
			if (fav_list[i].uid == e) return true;
		}
		return false;
	},

	tick : function() {	write_to_file(false); },
	forceSave : function() { write_to_file(true); },
	update: function() {
		index = 0;
		setTimeout(function(){
			update_favorites_list();
		}, 25);
	}
}

function write_to_file(f) {
	var ti = new Date().getTime() / 1000;
	last_change = ti;

	fs.writeFile(path.join(remote.app.getPath('appData'), remote.app.getName(), 'favorites.json'), JSON.stringify(fav_list), 'utf8', function(){
		
	});
}

function read_from_file(cb) {
	fs.readFile(path.join(remote.app.getPath('appData'), remote.app.getName(), 'favorites.json'), 'utf8', function (err,data) {
		if (err) {
			fav_list = [];
		} else {
			fav_list = JSON.parse(data);
			last_change = new Date().getTime() / 1000;
			cb(fav_list);
		}
	});

}

function update_favorites_list() {

	$.ajax({
		url: 'http://live.ksmobile.net/user/getinfo',
		data: {
			userid: fav_list[index].uid
		},
		cache: false,
		type: "GET",
		dataType: "json",
		timeout: 15000,
		error: function(e){
			callback_holder(return_data);
		},
		success: function(e) {

			if (e.status != 500) {
				fav_list[index].face = e.data.user.user_info.face;
				fav_list[index].nickname = e.data.user.user_info.nickname;
				if (index%9 == 0) {
					ipcRenderer.send('favorites-refresh');
				}
			} else {
				console.log(e);
			}
			
			index++;
			if (index < fav_list.length) {
				setTimeout(function(){
					update_favorites_list();
				}, 50);
			} else {
				ipcRenderer.send('favorites-refresh');
			}

		}
	});

}
