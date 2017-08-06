#!/bin/sh
rm -dr dist/LiveMeToo*
electron-packager src --out=dist --platform=win32  --arch=x64  --version-string.CompanyName='The Coder' --version-string.LegalCopyright='Copyright (C) 2017 by The Coder' --version-string.FileDescription=$npm_package_productName --version-string.OriginalFilename='LiveMeTools.exe' --version-string.InternalName=$npm_package_productName --version-string.ProductName=$npm_package_productName --version-string.ProductVersion=$npm_package_version --asar --icon=logo.ico --overwrite --prune=true 
electron-packager src --out=dist --platform=win32  --arch=ia32 --version-string.CompanyName='The Coder' --version-string.LegalCopyright='Copyright (C) 2017 by The Coder' --version-string.FileDescription=$npm_package_productName --version-string.OriginalFilename='LiveMeTools.exe' --version-string.InternalName=$npm_package_productName --version-string.ProductName=$npm_package_productName --version-string.ProductVersion=$npm_package_version --asar --icon=logo.ico --overwrite --prune=true 
electron-packager src --out=dist --platform=linux  --arch=x64  --icon=assets/icons/png/appicon.png --prune=true -asar --overwrite
electron-packager src --out=dist --platform=darwin --arch=x64  --icon=src/appicon.icns --prune=true --asar
electron-installer-debian --src dist/LiveMeTools-linux-x64/ --dest dist/ --arch amd64
