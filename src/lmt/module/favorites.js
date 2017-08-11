/*
	Favorites Module
*/
"use strict";

const	fs = require('fs'), {remote} = require('electron'), path = require('path');

var fav_list = [], last_change = 0, is_saved = false;

module.exports = {

	initIfNeeded: function() {
		if (last_change != 0) return;
		last_change = new Date().getTime() / 1000;
	},

	add : function(e) {
		fav_list.push(e);
		write_to_file();
	},

	remove: function(e) {
		var idx = 0;
		for (var i = 0; i < fav_list.length; i++) {
			if (fav_list[i].userid == e) {
				fav_list.splice(i, 1);
			}
		}
		write_to_file();
	},

	save: function() {
		write_to_file();
	},

	recall : function(cb) { 
		read_from_file(cb);
	},

	lastChange: function() { return last_change; },

	isOnList: function(e) {
		for (var i = 0; i < fav_list.length; i++) {
			if (fav_list[i].userid == e) return true;
		}
		return false;
	}
}

function write_to_file() {
	if (is_saved) { return; }

	var ti = new Date().getTime() / 1000;
	if ((ti - last_change) < 300) { return; }
	fs.writeFile(path.join(remote.app.getPath('appData'), remote.app.getName(), 'favorites.json'), JSON.stringify(fav_list), 'utf8', function(){});
	last_change = ti;
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
