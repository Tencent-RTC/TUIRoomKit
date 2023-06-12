QT += core gui network

greaterThan(QT_MAJOR_VERSION, 4): QT += widgets

QMAKE_MACOSX_DEPLOYMENT_TARGET= 11.0

TARGET = RoomKit
TEMPLATE = app

CONFIG += c++11
CONFIG += debug_and_release warn_on
CONFIG += thread exceptions stl
CONFIG += rtti_off

# set path for auto-generated ui header files
UI_DIR = ./auto-generated/ui_auto_gen
RCC_DIR += ./auto-generated

LIBS += -L"."
DEPENDPATH += .
MOC_DIR += ./auto-generated
OBJECTS_DIR += ./auto-generated/release

DESTDIR = ../bin

include(RoomKit.pri)
include(RoomModule.pri)
RESOURCES += $$PWD/Resource/RoomKit.qrc

INCLUDEPATH += $$PWD/Module/include
DEPENDPATH += $$PWD/Module/include
INCLUDEPATH += $$PWD/../utils
INCLUDEPATH += $$PWD/../utils/jsoncpp
INCLUDEPATH += $$PWD/../utils/BugReport
INCLUDEPATH += $$PWD/3rdParty/zlib/include
INCLUDEPATH += $$PWD/../Common
INCLUDEPATH += $$PWD/App/Common/MessageDispatcher

INCLUDEPATH += $${SOURCE_PATHS}
DEPENDPATH += $${SOURCE_PATHS}

INCLUDEPATH += $$PWD/App
INCLUDEPATH += $$PWD/App/Common

QMAKE_CFLAGS_RELEASE   = $$QMAKE_CFLAGS_RELEASE_WITH_DEBUGINFO
QMAKE_CXXFLAGS_RELEASE = $$QMAKE_CXXFLAGS_RELEASE_WITH_DEBUGINFO
QMAKE_LFLAGS_RELEASE   = $$QMAKE_LFLAGS_RELEASE_WITH_DEBUGINFO

win32 {
contains(QT_ARCH,i386) {
INCLUDEPATH += $$PWD/../utils/usersig/win/include
DEPENDPATH += $$PWD/../utils/usersig/win/include
INCLUDEPATH += $$PWD/../SDK/RoomEngineSDK/include/
INCLUDEPATH += $$PWD/../SDK/RoomEngineSDK/include/room/
INCLUDEPATH += $$PWD/../SDK/RoomEngineSDK/include/liteav/
INCLUDEPATH += $$PWD/../SDK/RoomEngineSDK/include/liteav/TRTC

LIBS += -L"$$PWD/../SDK/RoomEngineSDK/lib/Win32" \
    -L"$$PWD/3rdParty/zlib/x86" \
    -L"$$PWD/bin" \
    -lTUIRoomEngine \
    -lliteav \
    -lzlibstatic \
    -lUser32 \
    -lgdi32
} else {
INCLUDEPATH += $$PWD/../SDK/RoomEngineSDK/include/
INCLUDEPATH += $$PWD/../SDK/RoomEngineSDK/include/room/
INCLUDEPATH += $$PWD/../SDK/RoomEngineSDK/include/liteav/
INCLUDEPATH += $$PWD/../SDK/RoomEngineSDK/include/liteav/TRTC

LIBS += -L"$(ProjectDir)../SDK/RoomEngineSDK/lib/Win64" \
    -L"$(ProjectDir)3rdParty/zlib/x86_64" \
    -L"$(ProjectDir)bin" \
    -lTUIRoomEngine \
    -lliteav \
    -lzlibstatic \
    -lUser32 \
    -lgdi32
}
}

macx {
QMAKE_INFO_PLIST += Info.plist

INCLUDEPATH += $$PWD/../utils/usersig/mac

LIBS += -framework Accelerate
LIBS += -framework AudioUnit
LIBS += -lbz2
LIBS += -lresolv
#without c++11 & AppKit library compiler can't solve address for symbols
LIBS += -framework AppKit

QMAKE_CXXFLAGS += -x objective-c++
LIBS += -framework Foundation
LIBS += -framework CoreFoundation
LIBS += -framework Cocoa

LIBS += -lSystem
LIBS += -lz

LIBS += -framework Security
LIBS += -framework SystemConfiguration
LIBS += -framework JavaScriptCore

LIBS += -framework CoreMedia
LIBS += -framework CoreAudio
LIBS += -framework CoreVideo
LIBS += -framework CoreImage
LIBS += -framework AVFoundation
LIBS += -framework AudioToolbox
LIBS += -framework VideoToolbox
LIBS += -framework MetalKit
LIBS += -lz
LIBS += -ObjC
LIBS += -framework Metal
LIBS += -framework QuartzCore
LIBS += -framework ScreenCaptureKit
LIBS += -framework IOSurface

INCLUDEPATH += $$PWD/../SDK/RoomEngineSDK/mac
DEPENDPATH += $$PWD/../SDK/RoomEngineSDK/mac

LIBS += -F$$PWD/../SDK/RoomEngineSDK/mac/ -framework ImSDKForMac_Plus
INCLUDEPATH += $$PWD/../SDK/RoomEngineSDK/mac/ImSDKForMac_Plus.framework/cpluscplus/include

LIBS += -F$$PWD/../SDK/RoomEngineSDK/mac/ -framework TXLiteAVSDK_TRTC_Mac
INCLUDEPATH += $$PWD/../SDK/RoomEngineSDK/mac/TXLiteAVSDK_TRTC_Mac.framework/Headers/cpp_interface

LIBS += -F$$PWD/../SDK/RoomEngineSDK/mac/ -framework TUIRoomEngine_Mac
INCLUDEPATH += $$PWD/../SDK/RoomEngineSDK/mac/TUIRoomEngine_Mac.framework/Headers/cpp_interface
DEPENDPATH += $$PWD/../SDK/RoomEngineSDK/mac/TUIRoomEngine_Mac.framework/Headers/cpp_interface

LIBS += -F$$PWD/../SDK/RoomEngineSDK/mac/TXFFmpeg.xcframework/macos-arm64_x86_64/ -framework TXFFmpeg

INCLUDEPATH += $$PWD/../SDK/RoomEngineSDK/mac/TXFFmpeg.xcframework/macos-arm64_x86_64
DEPENDPATH += $$PWD/../SDK/RoomEngineSDK/mac/TXFFmpeg.xcframework/macos-arm64_x86_64

LIBS += -F$$PWD/../SDK/RoomEngineSDK/mac/TXSoundTouch.xcframework/macos-arm64_x86_64/ -framework TXSoundTouch

INCLUDEPATH += $$PWD/../SDK/RoomEngineSDK/mac/TXSoundTouch.xcframework/macos-arm64_x86_64
DEPENDPATH += $$PWD/../SDK/RoomEngineSDK/mac/TXSoundTouch.xcframework/macos-arm64_x86_64

QMAKE_CXXFLAGS += -std=gnu++11
#CONFIG += console
}
