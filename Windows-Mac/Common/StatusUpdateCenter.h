#ifndef __COMMON_STATUSUPDATECENTER_H__
#define __COMMON_STATUSUPDATECENTER_H__
#include <QObject>
#include "TUIRoomDef.h"
#include "CommonDef.h"

class StatusUpdateCenter : public QObject {
	Q_OBJECT
public:
    static StatusUpdateCenter& Instance();
signals:
    void SignalUpdateUserInfo(const TUIUserInfo& user_info);
    void SignalStageListLayoutChanged(StageListDirection direction);
    void SignalCloseMainWindow(TUIExitRoomType type);
    void SignalMainWindowActive();
private:
    StatusUpdateCenter(QObject *parent);
	~StatusUpdateCenter();
};

#endif // __COMMON_STATUSUPDATECENTER_H__