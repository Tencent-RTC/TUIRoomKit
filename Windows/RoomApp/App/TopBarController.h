#pragma once

#include <QWidget>
#include "ui_TopBarController.h"
#include "SettingViewController.h"
#include "CommonDef.h"
#include "LayoutSelectView.h"

class TopBarController : public QWidget
{
    Q_OBJECT

public:
    TopBarController(QWidget *parent = Q_NULLPTR);
    ~TopBarController();
    void SetRoomID(const std::string& room_id);
protected:
    bool eventFilter(QObject *obj, QEvent *event);
public slots:
    void OnNetStatistics(const liteav::TRTCStatistics& statis);
    void OnNetQuality(UserNetQualityInfo local_user_quality, std::vector<UserNetQualityInfo> remote_users_quality);
    void SlotOnSwitchLayout();
    void SlotCloseSelectView();
signals:
    void SignalShowSetting(int index);
    void SignalStageListLayoutChanged(StageListDirection direction);
private:
    Ui::TopBarController ui;
    NetToolTip  net_tooltip_;
    QString net_quality_;

    LayoutSelectView* layout_select_view_ = nullptr;
};
