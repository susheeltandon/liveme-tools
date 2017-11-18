/*

	DataManager Module

*/

const 	low = require('lowdb'), 
		FileSync = require('lowdb/adapters/FileSync'),
		path = require('path'),
		{ remote } = require('electron')
		adapter = new FileSync(path.join(remote.app.getPath('appData'), remote.app.getName(), 'livemetools_db.json')),
		db = low(adapter);


class DataManager {

    constructor() {
    	this._favorites = [];
    	this._visited = [];

        this.events = new (events.EventEmitter)();
    }

	_emit(eventName, object) {
		this.events.emit(eventName, object);
	}    

	ResetDB() {
		db.defaults({
			favorites: [],
			visited: [],
			downloaded: []
		})
	}



	/*
		Favorites
	*/
	addFavorite(u) {

	}
	dropFavorite(u) {

	}
	updateFavorite(u) {

	}
	isInFavorites(u) {

	}

	importFavorites(f) {

	}
	exportFavorites(f) {

	}



	/*
		Tracking of Visited UserIds
	*/
	addTrackedVisited(u) {

	}
	wasVisited(u) {

	}
	expireVisited() {

	}


}

exports.DataManager = DataManager;
