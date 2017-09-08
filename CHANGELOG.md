## CHANGELOG

### 5.x.x Releases


### 4.x.x Releases

#### 2017-09-05 - v4.6.1
**Fixed:**
- Removed download from being re-added back to queue upon failure.
- Added input cleanup when importing a list of URLs to download.

#### 2017-08-31 - v4.6.0
**Added:**
- Added ability to cancel getting user's replays.
- Minor code improvements.

**Fixed:**
- Cleanup of code.
- Removed debug code found.

#### 2017-08-30 - v4.5.0
**Added:**
- Updated favorites list to now show extended info when available.
- Added status text when doing lookups and searches.
- Added bad UID detectors and handlers for lookups.

**Fixed:**
- Issue #39
- Issue #40
- Typos fixed.

#### 2017-08-26 - v4.4.2
**Added:**
- Added save_queue to purge_queue function
- Added null detector when closing the app that happens occasionally.

**Fixed:**
- Removed debug code.
- Minor code cleanup and optimization

#### 2017-08-25 - v4.4.0
**Added:**
- Issue #37

#### 2017-08-23 - v4.3.0
**Added:**
- Ability to flush all queue'd download entries from Settings page.
- Ability to refresh the User Avatar and Nickname list in Favorites window
- Some null detectors to help avoid error popping up.

**Fixed:**
- Issue #31
- Issue #33
- Issue #34

#### 2017-08-21 - v4.2.0
Minor coding fixes and cleanup.  Also fixed the detector bug in the Update notice.

#### 2017-08-20 - v4.1.5
**Added:**
- Now checks for updated versions availability

**Fixed:**
- Issue #29
- Issue #31

#### 2017-08-16 - v4.1.3
**Fixed:**
- Issue #28

#### 2017-08-16 - v4.1.2
**Fixed:**
- Issue #27

#### 2017-08-15 - v4.1.1
**Added:**
- Variable height resizing of queue window

**Fixed:**
- Issue #25
- Issue #26

#### 2017-08-15 - v4.1.0
**Added:**
- Added button to hide download queue
- Added ability to remove entries from download queue (Issue #24)

**Fixed:**
- Issue #23

#### 2017-08-14 - v4.0.0
**Added:**
- New download queue and handler, now supports using FFMPEG
- Ability to enable custom filenaming of downloaded playlists
- Improved list renderings
- Improved user interfaces
- Ability to disable/enable download history tracking
- Auto-recovery of download queue if crashed or closed before they are finished
- and much much more!

**Fixed:**
- Issue #15
- Issue #16
- Issue #18
- Iusse #20

### 3.x.x Releases

#### 2017-08-10 - v3.6.0
**Added:**
- polydragon's chat history code

**Fixed:**
- Couple minor code bugs

#### 2017-08-10 - v3.5.6
**Added:**
- Button to show the queue window

**Fixed:**
- An issue where the queue download list would sometimes have a stale entry that would be ignored

#### 2017-08-10 - v3.5.4
**Fixed:**
- Issue #14
- Minor bug in queue causing entries to be stalled and remain

#### 2017-08-09 - v3.5.2
**Fixed:**
- Couple minor bugs with favorites
- Fix slowdown of Fans and Following lists not fully loading.

#### 2017-08-09 - v3.5.1
**Fixed:**
- Bug in favorites storage

#### 2017-08-09 - v3.5.0
**Added:**
- Now keeps track of what's been downloaded to avoid multiple downloads.
- Queue recovery if the app crashes.

**Fixed:**
- Issue #10
- Issue #11
- Issue #12
- Issue #13

### Prior Releases
**See [Releases](https://github.com/thecoder75/liveme-tools/releases) for details on prior versions.**
