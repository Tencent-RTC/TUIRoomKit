cd ../../

cp -r ./SDK/ImSDK/Mac/ImSDKForMac_CPP.framework ./bin/RoomApp.app/Contents/ImSDKForMac_CPP.framework

cp -r ./RoomApp/Resource/trtcres ./bin/RoomApp.app/Contents/MacOS/trtcres

cp -r ./RoomApp/Resource/MacOSX/RoomApp.icns ./bin/RoomApp.app/Contents/Resources/
cp -r ./RoomApp/Resource/MacOSX/Info.plist ./bin/RoomApp.app/Contents/

cd ./bin/RoomApp.app/Contents/MacOS/
install_name_tool -change @rpath/ImSDKForMac_CPP.framework/Versions/A/ImSDKForMac_CPP @executable_path/../ImSDKForMac_CPP.framework/Versions/A/ImSDKForMac_CPP ./RoomApp