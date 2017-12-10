# LiveMe Tools

**The 6.3.x branch is being maintained as the current stable branch/release of LiveMe Tools.  It is recommended you DO NOT download any releases from the 7.0.x branch at this time.**

### Build Status
**Windows:** [![Build status](https://ci.appveyor.com/api/projects/status/al0lo5cr41ssqd74/branch/master?svg=true)](https://ci.appveyor.com/project/thecoder75/liveme-tools/branch/master) **macOS/Linux:** [![Build Status](https://travis-ci.org/thecoder75/liveme-tools.svg?branch=master)](https://travis-ci.org/thecoder75/liveme-tools)

This is an Electron-based desktop app for Windows, macOS and Ubuntu Linux designed to:
- Allow viewing a list of live videos with filter options
- Search for users or videos tagged with hashtags
- View details on users and their replays
- Track previously viewed users
- Watch and download replay videos
- Create local Favorites lists without an account
- Import and Export Favorites lists
- Import a list of Replay URLs or VideoIDs for downloading
- Ability to add a single URL
- Uses a custom chunk downloader and FFMPEG to download replays
- and much more!

## Getting Started

### Downloading and Installing

[![All Downloads](https://img.shields.io/github/downloads/thecoder75/liveme-tools/total.svg)](https://github.com/thecoder75/liveme-tools/releases)

*Click the button above to go to the downloads.*

### Building from Scratch

You will need to download and install `yarn` package manager if you wish to build executables for Windows.  This also relies on the [LiveMe API](https://github.com/thecoder75/liveme-api) module for the main communications with the Live.me servers.

Extract to a folder and execute either `yarn install` or `npm install` to install all of the required modules.  

To execute in developer mode, run `yarn dev` or `npm run dev`.  To build executables for your OS, run `yarn dist` or `npm run dist`.

## Built With
* [Electron](http://electron.atom.io)
* [NodeJS](http://nodejs.org)

## Contributors
* [thecoder75](https://github.com/thecoder75)
* [polydragon](https://github.com/polydragon)
* [zp](https://github.com/zp)

## Bug Hunters and Beta Testers
* [slyfox99](https://github.com/slyfox99)
* [thegeezer9999](https://github.com/thegeezer9999)
* [jaylittt](https://github.com/jaylittt)
* [ushall](https://github.com/ushall)
* [destruck51](https://github.com/destruck51)
* [mmind99](https://github.com/mmind99)

## License
This project is licensed under the GPL-3 License - see the [LICENSE](LICENSE)
file for details
