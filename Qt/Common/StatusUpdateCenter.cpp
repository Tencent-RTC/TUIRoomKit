#include "StatusUpdateCenter.h"

StatusUpdateCenter::StatusUpdateCenter(QObject *parent)
	: QObject(parent) {
    qRegisterMetaType<StageListDirection>("StageListDirection");
    qRegisterMetaType<TUIExitRoomType>("TUIExitRoomType");
}
StatusUpdateCenter::~StatusUpdateCenter(){
}

StatusUpdateCenter& StatusUpdateCenter::Instance(){
	static StatusUpdateCenter instance(nullptr);
	return instance;
}
