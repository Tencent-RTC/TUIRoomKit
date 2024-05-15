#pragma once

#include <QWidget>
#include "ui_ScreenShareItem.h"
#include "IScreenShareManager.h"
#include <QCheckBox>
#include "../utils/log.h"

class ScreenShareItem : public QWidget {
    Q_OBJECT

public:
    ScreenShareItem(QWidget *parent = Q_NULLPTR, bool default_checked = false);
    ~ScreenShareItem();

    void SetInfo(void* source_id, IScreenShareManager::ScreenCaptureSourceType type, QString name, QPixmap img);
    bool IsChecked();
    IScreenShareManager::ScreenCaptureSourceInfo GetInfo();
    void UpdateStyle(bool bSelected);
public slots:
    void OnCheckedChanged(int state);
signals:
    void SignalChecked(void* source_id, bool bChecked);
protected:
    virtual void leaveEvent(QEvent *event);
    virtual void enterEvent(QEvent *event);
    virtual void mousePressEvent(QMouseEvent *event);
private:
    Ui::ScreenShareItem ui;
    bool is_checked;
    IScreenShareManager::ScreenCaptureSourceInfo info_;
    QPixmap img_;
    QCheckBox ckbox_;
};
