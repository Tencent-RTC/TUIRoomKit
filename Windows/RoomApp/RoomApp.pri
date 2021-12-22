
HEADERS += ./utils/json.h \
    ./utils/log.h \
    ./utils/UserDirectory.h \
    ./utils/usersig/mac/include/GenerateTestUserSig.h \
    ./utils/usersig/mac/UserSigConfig.h \
    ./App/CommonDef.h \
    ./App/BottomBarController.h \
    ./App/ChatRoomViewController.h \
    ./App/ChatMessageView.h \
    ./App/TopBarController.h \
    ./App/LayoutSelectView.h \
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
    ./App/TransferRoomController.h \
    ./App/Common/DataStore.h \
    ./App/Common/ViewDragger.h \
    ./App/Common/ScreenCenter.h \
    ./App/Common/TXMessageBox.h \
    ./App/Common/TXImageButton.h \
    ./App/MessageDispatcher/MessageDispatcher.h \
    ./App/Common/StatusUpdateCenter.h
SOURCES += ./utils/jsoncpp.cpp \
    ./utils/log.cpp \
    ./utils/UserDirectory.cpp \
    ./App/BottomBarController.cpp \
    ./App/ChatMessageView.cpp \
    ./App/ChatRoomViewController.cpp \
    ./App/MainWindowLayout.cpp \
    ./App/PresetDeviceController.cpp \
    ./App/LayoutSelectView.cpp \
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
    ./App/TransferRoomController.cpp \
    ./App/Common/DataStore.cpp \
    ./App/Common/ScreenCenter.cpp \
    ./App/Common/TXMessageBox.cpp \
    ./App/Common/TXImageButton.cpp \
    ./App/Common/ViewDragger.cpp \
    ./App/MessageDispatcher/MessageDispatcher.cpp \
    ./App/Common/StatusUpdateCenter.cpp
FORMS += ./App/Form/BottomBarController.ui \
    ./App/Form/ChatRoomViewController.ui \
    ./App/Form/PresetDeviceController.ui \
    ./App/Form/LayoutSelectView.ui \
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
    ./App/Form/TransferUserItem.ui \
    ./App/Form/TXMessageBox.ui \
    ./App/Form/TXImageButton.ui
RESOURCES += Resource/RoomApp.qrc
