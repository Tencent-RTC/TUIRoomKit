HEADERS += ../utils/json.h \
    ../utils/log.h \
    ../utils/UserDirectory.h \
    ../utils/usersig/mac/include/GenerateTestUserSig.h \
    ../utils/usersig/mac/UserSigConfig.h \
    ../Common/MessageDispatcher/MessageDispatcher.h \
    ../Common/ViewDragger.h \
    ../Common/ScreenCenter.h \
    ../Common/TXMessageBox.h \
    ../Common/TXImageButton.h \
    ../Common/StatusUpdateCenter.h \
	./App/Common/DataStore.h \
    ./App/CommonDef.h \
    ./App/BottomBarController.h \
    ./App/ChatRoomViewController.h \
    ./App/ChatMessageView.h \
    ./App/TopBarController.h \
    ./App/LayoutSelectView.h \
    ./App/RoomTipsView.h \
    ./App/VideoRenderViewInfo.h \
    ./App/SmallTopBarController.h \
    ./App/MainWindowLayout.h \
    ./App/VideoRenderView.h \
    ./App/StageListController.h \
    ./App/SettingViewController.h \
    ./App/ScreenShareWindow.h \
    ./App/ScreenShareItem.h \
    ./App/PopStageListController.h \
    ./App/MemberListViewController.h \
    ./App/MemberItemView.h \
    ./App/MainWindow.h \
    ./App/LoginViewController.h \
    ./App/PresetDeviceController.h \
    ./App/TransferRoomController.h
win32{
    HEADERS +=../utils/BugReport/crash_dump.h \
              ../utils/usersig/win/GenerateTestUsersig.h
}

SOURCES += ../utils/jsoncpp.cpp \
    ../utils/log.cpp \
    ../utils/UserDirectory.cpp \
    ../Common/MessageDispatcher/MessageDispatcher.cpp \
    ../Common/ScreenCenter.cpp \
    ../Common/TXMessageBox.cpp \
    ../Common/TXImageButton.cpp \
    ../Common/ViewDragger.cpp \
    ../Common/StatusUpdateCenter.cpp \
	./App/Common/DataStore.cpp \
    ./App/BottomBarController.cpp \
    ./App/ChatMessageView.cpp \
    ./App/ChatRoomViewController.cpp \
    ./App/MainWindowLayout.cpp \
    ./App/PresetDeviceController.cpp \
    ./App/LayoutSelectView.cpp \
	./App/RoomTipsView.cpp \
    ./App/LoginViewController.cpp \
    ./App/main.cpp \
    ./App/MainWindow.cpp \
    ./App/MemberItemView.cpp \
    ./App/MemberListViewController.cpp \
    ./App/PopStageListController.cpp \
    ./App/ScreenShareItem.cpp \
    ./App/ScreenShareWindow.cpp \
    ./App/SettingViewController.cpp \
    ./App/SmallTopBarController.cpp \
    ./App/StageListController.cpp \
    ./App/TopBarController.cpp \
    ./App/VideoRenderViewInfo.cpp \
    ./App/VideoRenderView.cpp \
    ./App/TransferRoomController.cpp
win32{
    SOURCES +=../utils/BugReport/crash_dump.cc \
              ../utils/usersig/win/GenerateTestUsersig.cpp
}

FORMS += ../Common/Form/TXMessageBox.ui \
    ../Common/Form/TXImageButton.ui \
	./App/Form/BottomBarController.ui \
    ./App/Form/ChatRoomViewController.ui \
    ./App/Form/PresetDeviceController.ui \
    ./App/Form/LayoutSelectView.ui \
	./App/Form/RoomTipsView.ui \
    ./App/Form/LoginViewController.ui \
    ./App/Form/MainWindow.ui \
    ./App/Form/MemberItemView.ui \
    ./App/Form/MemberListViewController.ui \
    ./App/Form/PopStageListController.ui \
    ./App/Form/ScreenShareItem.ui \
    ./App/Form/ScreenShareWindow.ui \
    ./App/Form/SettingViewController.ui \
    ./App/Form/SmallTopBarController.ui \
    ./App/Form/StageListController.ui \
    ./App/Form/TopBarController.ui \
    ./App/Form/VideoRenderViewInfo.ui \
    ./App/Form/VideoRenderView.ui \
    ./App/Form/TransferRoomController.ui \
    ./App/Form/TransferUserItem.ui
	
RESOURCES += Resource/RoomApp.qrc
