# ffmpeg Download Engine

## 1. Download ffmpeg

### Windows
1. Get ffmpeg from [here](http://ffmpeg.zeranoe.com/builds/).
2. Extract the zip to your C:\ drive.

### Linux
/// todo

### Mac
/// todo

## 2. Update Environment Variables
### Windows
1. Right-click on 'This PC' or 'My Computer', and go to Properties.
2. Click on 'Advanced System Settings'.
3. Make sure you're on the 'Advanced' tab.
4. Click on 'Environment Variables' at the bottom.
5. Click on 'New' and enter the following:  
Variable Name: `FFMPEG_PATH`  
Variable Path: `C:\ffmpeg\bin\ffmpeg.exe`
6. Click 'OK' then click on 'New' again, this time enter the following:  
Variable Name: `FFPROBE_PATH`  
Variable Path: `C:\ffmpeg\bin\ffprobe.exe`
7. Click 'OK' on everything to save your changes.
8. If LiveMe-Tools was open, close and re-open it.

## 3. Update settings
1. Click on the settings icon inside LiveMe-Tools.
2. Make sure the 'Download Engine' is set to 'ffmpeg'.