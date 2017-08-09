const PassThrough = require('stream').PassThrough;
const urlResolve = require('url').resolve;
const miniget = require('miniget');
const m3u8 = require('./m3u8-parser');
const Queue = require('./queue');

/**
 * @param {String} playlistURL
 * @param {Object} options
 * @return {stream.Readable}
 */
module.exports = function(playlistURL, options) {
    var stream = new PassThrough();

    options = options || { 
        on_complete: function(e) {},
        on_error: function(e) {},
        on_progress: function(e) { return { current: 0, total: 0 }}
    };
    var chunkReadahead = options.chunkReadahead || 3;
    var refreshInterval = options.refreshInterval || 600000; // 10 minutes
    var requestOptions = options.requestOptions;

    var latestSegment;
    var streamQueue = new Queue(function(segment, callback) {
        latestSegment = segment;
        segment.pipe(stream, {
            end: false
        });
        segment.on('end', callback);
    }, {
        concurrency: 1
    });

    // When to look for items again.
    var refreshThreshold;
    var fetchingPlaylist = false;
    var destroyed = false;
    var ended = false;
    var totalSegments = 0, currentSegment = 0;

    var requestQueue = new Queue(function(segmentURL, callback) {
        var segment = miniget(urlResolve(playlistURL, segmentURL), requestOptions);
        segment.on('error', callback);
        streamQueue.push(segment, callback);
        
        currentSegment++;
        if (totalSegments > currentSegment) {
            options.on_progress({
                current: currentSegment,
                total: totalSegments
            });

        }

    }, {
        concurrency: chunkReadahead,
        unique: function(segmentURL) {
            return segmentURL;
        },
    });

    function onError(err) {
        options.on_error(err);
        stream.emit('error', err);
        stream.end();
    }

    function onQueuedEnd(err) {
        if (err) {
            onError(err);
        } else if (!fetchingPlaylist && !destroyed && !ended &&
            requestQueue.tasks.length + requestQueue.active === refreshThreshold) {
            refreshPlaylist();
        } else if (ended && !requestQueue.tasks.length && !requestQueue.active) {
            options.on_complete({ url: playlistURL, total_parts: totalSegments });
            stream.end();
        }
    }

    var tid;

    function refreshPlaylist() {
        clearTimeout(tid);
        fetchingPlaylist = true;
        var req = miniget(playlistURL, requestOptions);
        req.on('error', onError);
        var parser = req.pipe(new m3u8());
        parser.on('tag', function(tagName) {
            if (tagName === 'EXT-X-ENDLIST') {
                ended = true;
                req.unpipe();
                clearTimeout(tid);
            }
        });
        parser.on('item', function(item) {
            totalSegments++;
            requestQueue.push(item, onQueuedEnd);
        });
        parser.on('end', function() {
            refreshThreshold = Math.ceil(totalItems * 0.01);
            tid = setTimeout(refreshPlaylist, refreshInterval);
            fetchingPlaylist = false;
        });
        
    }
    refreshPlaylist();

    stream.end = function() {
        destroyed = true;
        streamQueue.die();
        requestQueue.die();
        clearTimeout(tid);
        if (latestSegment) {
            latestSegment.unpipe();
        }
        PassThrough.prototype.end.call(stream);
    };

    return stream;
};

