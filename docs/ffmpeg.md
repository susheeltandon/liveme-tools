# Setting up ffmpeg

You **must** have ffmpeg installed on your computer to enable the merging of the download chunks. 

### Linux Users

You can obtain the latest version from the repository for your distribution.

### macOS Users

Download the prebuilt binaries and copy them to `/usr/local/bin` directory using the Terminal app.  Be sure to also set their permissions
using `chmod +x /usr/local/bin/ff*`

### Windows Users

1. Download the [ffmpeg binaries from here](http://ffmpeg.zeranoe.com/builds/).
2. Extract the .zip to any folder.
3. In LiveMe Tools, click `File` then `Preferences`.
4. Click on the `...` button for `FFMPEG` and browse into the newly created directory from the ffmpeg .zip.
5. Browse into the `bin` directory and select `ffmpeg.exe`.
6. Repeat steps 4 and 5 but for `FFPROBE`.
7. Click on `Test FFMPEG`, it should say that the test was successful.
