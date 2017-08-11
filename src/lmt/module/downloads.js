/*
	Downloads Module
*/

var download_queue = [], download_history = [], can_run = false, is_running = false;

module.exports = {
    /*
        Expecting data in this format:
        url: "http://xyz.m3u8",
        user: {
            user_id: 123,
            user_name: "name"
        },
        video: {
            video_id: 123,
            video_title: "name",
            video_time: 123
        }
    */
    add: function(Url, User, Video) {
        download_queue.push({ url: Url, user: User, video: Video });
    },
    
    /*
        Starts/Resumes downloading
    */
    start: function() {
        if (download_queue.length > 0) {
            can_run = true;
        }

        if (!is_running && can_run) {
            runDownloader();
        }
    },

    /*
        Stops downloading any new files after the one(s) it's downloading now, until told to start again
    */
    stop: function() {
        can_run = false;
    },

    /*
        Called on startup
    */
    init: function() {
        loadQueue();
        loadHistory();
    },

    is_running: function() {
        return is_running;
    },

    is_paused: function() {
        return !can_run; // If it can't run, it is paused
    },

    /* 
        TODO: Look up what Electron ships with support for; I don't want to add too many dependencies
        Observable or something to subscribe to be notified about status of downloads, for the downloads page
    */
    subscribe_to_progress: function() {

    }
};

function loadQueue() {

}

function saveQueue() {

}

function loadHistory() {

}

function saveHistory() {

}

/*
    Pop an item from the queue and process it here
*/
function processItem(item) {

}

/*
    Starts processing the download queue until it's paused or empty
*/
function runDownloader() {
    while (download_queue.length > 0 && can_run) {
        let item = download_queue.unshift();
        processItem(item);
    }
}