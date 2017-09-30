## CHANGELOG

### 6.x.x Releases

#### TBD - v6.0.6
**Added:**
- Updated video progress bar styling for better visibility
- Ffmpeg checks to see if it's available and alert you if it can't be found on startup.
- Added settings:
  - You can manually choose a version of ffmpeg for LMT to use.
  - A button to check if ffmpeg is valid and can be used.
- Added a basic check to see if the user is currently live. If they aren't, re-enable the download on an alternate link. (If the first one linked to a live url but they weren't live - it wouldn't work)

**Fixed:**
- Fixed broken time in message history.
- Fixed time jumping from message history when time was clicked on.
- Fixed settings resetting if you changed download directory but didn't save.
- Fixed download directory window not showing.
- Fixed crash if you use File -> Quit.

**Changed:**
- Bundling Windows versions as a portable version. No extraction required.
- Merged x64 and x86 into one portable version - it will use the x64 version if you're running 64-bit and the x86 version if you're running on 32-bit.
- Color of downloaded video highlight is now a green, instead of a very faint white.

#### 2017-09-26 - v6.0.5
**Fixed:**
- Fixed broken VideoID search

#### 2017-09-26 - v6.0.4
**Added:**
- Will show the details of the video that was directly search by VideoID

#### 2017-09-26 - v6.0.3
**Added:**
- Restored the context (right-click) menu to text fields.

**Fixed:**
- Removed FFMPEG prompt
- Fixed Username search not returning results at times.
- Fixed replays not showing at times due to all being invisible and not downloaded.
- Fixed closing issue experienced by some users.

#### 2017-09-25 - v6.0.2
**Fixed:**
- Fixed issue where LiveMeOMG page was sending the VideoID instead of the URL to the player.

#### 2017-09-25 - v6.0.1
**Fixed:**
- Removed bundled FFMPEG executable due to issues with macOS and Windows systems.

#### 2017-09-24 - v6.0.0
**Added:**
- Migrated to using LiveMe API module 
- Whole new UI styling added
- Added custom video player UI
- Added ability to jump to video time index from message history by click on the time
- Added ability to trigger a search by clicking on the username in the message history
- Added autoload of content when you scroll to the bottom with loading of 10 entries at a time
- Added LiveMe OMG window with ability to watch videos from it and search the users (All, Only Girls, Only Boys)

**Fixed:**
- Moved List Import and Export functions to main thread
- Major code cleanups
- Upgraded jQuery to 3.2.1 from 2.2.4
- Improved network data speeds by moving all web requests to Node modules from jQuery

### 5.x.x Releases

#### 2017-09-17 - v5.0.9 
**Added:**
- Can now delete active downloads as well.

**Fixed:**
- See commits for details.

#### 2017-09-13 - v5.0.6
**Added:**
- Automatically will download FFMPEG if its not found on the computer.

**Fixed:**
- Updated to use only FFMPEG for downloading of playlists.
- Issue #54
- Issue #56
- Issue #57

#### 2017-09-11 - v5.0.3
**Fixed:**
- Search loop issue
- Minor favorites cleanup


#### 2017-09-11 - v5.0.2
**Added:**
- Will show queue window when first download is clicked now.

**Fixed:**
- Issue #59
- Issue #56


#### 2017-09-08 - v5.0.1
**Fixed:**
- Fixed no replays when set to unlimited replays.


#### 2017-09-08 - v5.0.0
**Added:**
- Option to empty download queue now available in the queue window
- Ability to add a single URL to download queue
- Ability to limit number of replay results
- Import of a list of VideoIDs
- Export a list of Favorites (UserID) list
- Shows VideoID of each replay next to its URL

**Fixed:**
- Disabled Live Video download so it doesn't cause a hangup of the queue
- Moved custom modules to main thread to fix multiple instance issues and lost data 
- Adding a URL to downloader igored Pause state (See #47)
- Fixed critical download and queue bugs (See #47)
- Fixed critical FFMPEG bug (See #47)
- Fixed URL removal bug (See #47)


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
