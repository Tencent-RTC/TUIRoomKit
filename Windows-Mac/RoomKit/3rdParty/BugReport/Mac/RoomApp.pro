QT += core gui webenginewidgets network

greaterThan(QT_MAJOR_VERSION, 4): QT += widgets

TARGET = RoomApp
TEMPLATE = app

CONFIG += c++11
CONFIG += debug_and_release warn_on
CONFIG += thread exceptions rtti stl

# set path for auto-generated ui header files
UI_DIR = ./auto-generated/ui_auto_gen
RCC_DIR += ./auto-generated

LIBS += -L"."
DEPENDPATH += .
MOC_DIR += ./auto-generated
OBJECTS_DIR += ./auto-generated/release

DESTDIR = ../bin

include(RoomApp.pri)
include(RoomModule.pri)
RESOURCES += $$PWD/Resource/RoomApp.qrc

INCLUDEPATH += $$PWD/../Module/include
DEPENDPATH += $$PWD/../Module/include
INCLUDEPATH += $$PWD/../utils
INCLUDEPATH += $$PWD/../utils/jsoncpp
INCLUDEPATH += $$PWD/../Common
INCLUDEPATH += $$PWD/../Common/MessageDispatcher

INCLUDEPATH += $${SOURCE_PATHS}
DEPENDPATH += $${SOURCE_PATHS}

INCLUDEPATH += $$PWD/App
INCLUDEPATH += $$PWD/App/Common

QMAKE_CFLAGS_RELEASE   = $$QMAKE_CFLAGS_RELEASE_WITH_DEBUGINFO
QMAKE_CXXFLAGS_RELEASE = $$QMAKE_CXXFLAGS_RELEASE_WITH_DEBUGINFO
QMAKE_LFLAGS_RELEASE   = $$QMAKE_LFLAGS_RELEASE_WITH_DEBUGINFO

win32 {
contains(QT_ARCH,i386) {
INCLUDEPATH += $$PWD/../SDK/LiteAVSDK/CPlusPlus/Win32/include/
INCLUDEPATH += $$PWD/../SDK/LiteAVSDK/CPlusPlus/Win32/include/TRTC

LIBS += -L"$(ProjectDir)../SDK/LiteAVSDK/CPlusPlus/Win32/lib" \
    -L"$(ProjectDir)../SDK/ImSDK/Win/lib/Win32" \
    -L"$(ProjectDir)3rdParty/zlib/x86" \
    -L"$(ProjectDir)bin" \
    -lliteav \
    -lImSDK \
    -lzlibstatic
} else {
INCLUDEPATH += $$PWD/../SDK/LiteAVSDK/CPlusPlus/Win64/include/
INCLUDEPATH += $$PWD/../SDK/LiteAVSDK/CPlusPlus/Win64/include/TRTC

LIBS += -L"$(ProjectDir)../SDK/LiteAVSDK/CPlusPlus/Win64/lib" \
    -L"$(ProjectDir)../SDK/ImSDK/Win/lib/Win64" \
    -L"$(ProjectDir)3rdParty/zlib/x86_64" \
    -L"$(ProjectDir)bin" \
    -lliteav \
    -lImSDK \
    -lzlibstatic
}

INCLUDEPATH += $$PWD/../SDK/ImSDK/Win/include/
INCLUDEPATH += $$PWD/../utils/BugReport/
INCLUDEPATH += $$PWD/3rdParty/zlib/include/
INCLUDEPATH += $$PWD/../utils/usersig/win/include
DEPENDPATH += $$PWD/../utils/usersig/win/include
}

macx {
QMAKE_INFO_PLIST += Info.plist

# ��ӿ�����
LIBS += "-F$$PWD/../utils/usersig/mac"
LIBS += "-F$$PWD/../SDK/LiteAVSDK/CPlusPlus/Mac"
LIBS += "-F$$PWD/../SDK/ImSDK/Mac"
LIBS += -framework TXLiteAVSDK_TRTC_Mac
LIBS += -framework ImSDKForMac_CPP
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

LIBS += -F$$PWD/../SDK/LiteAVSDK/CPlusPlus/Mac/TXFFmpeg.xcframework/macos-arm64_x86_64
LIBS += -F$$PWD/../SDK/LiteAVSDK/CPlusPlus/Mac/TXSoundTouch.xcframework/macos-arm64_x86_64
LIBS += -framework TXFFmpeg
LIBS += -framework TXSoundTouch

ImSDK_FRAMEWORK.files = $$PWD/../SDK/ImSDK/Mac/ImSDKForMac_CPP.framework
ImSDK_FRAMEWORK.path = /Contents/Frameworks
QMAKE_BUNDLE_DATA += ImSDK_FRAMEWORK

TXFFmpeg_FRAMEWORK.files = $$PWD/../SDK/LiteAVSDK/CPlusPlus/Mac/TXFFmpeg.xcframework/macos-arm64_x86_64/TXFFmpeg.framework
TXFFmpeg_FRAMEWORK.path = /Contents/Frameworks
QMAKE_BUNDLE_DATA += TXFFmpeg_FRAMEWORK

TXSoundTouch_FRAMEWORK.files = $$PWD/../SDK/LiteAVSDK/CPlusPlus/Mac/TXSoundTouch.xcframework/macos-arm64_x86_64/TXSoundTouch.framework
TXSoundTouch_FRAMEWORK.path = /Contents/Frameworks
QMAKE_BUNDLE_DATA += TXSoundTouch_FRAMEWORK

LIBS += "-F$$PWD/3rdParty/BugReport/Mac"
LIBS += -framework BuglyOAMac
INCLUDEPATH += $$PWD/3rdParty/BugReport/Mac/BuglyOAMac.framework/Headers

# ���TXLiteAVSDK_TRTC_Mac.frameworkͷ�ļ�
INCLUDEPATH += $$PWD/../SDK/LiteAVSDK/CPlusPlus/Mac/TXLiteAVSDK_TRTC_Mac.framework/Headers/cpp_interface
INCLUDEPATH += $$PWD/../SDK/LiteAVSDK/CPlusPlus/Mac/TXLiteAVSDK_TRTC_Mac.framework/Headers

# ���ImSDKForMac.frameworkͷ�ļ�
INCLUDEPATH += $$PWD/../SDK/ImSDK/Mac/ImSDKForMac_CPP.framework/Headers
QMAKE_LFLAGS += -Wl,-rpath,@executable_path/../Frameworks/

macx: LIBS += -L$$PWD/../utils/usersig/mac -lTXLiteAVTestUserSig
macx: PRE_TARGETDEPS += $$PWD/../utils/usersig/mac/libTXLiteAVTestUserSig.a
QMAKE_CXXFLAGS += -std=gnu++11
#CONFIG += console

INCLUDEPATH += $$PWD/../utils/usersig/mac/include
DEPENDPATH += $$PWD/../utils/usersig/mac/include

DISTFILES += $$PWD/../utils/usersig/mac/libTXLiteAVTestUserSig.a
}


