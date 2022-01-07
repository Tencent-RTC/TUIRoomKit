#pragma once

#include <QWidget>
#include "ui_RoomTipsView.h"

class RoomTipsView : public QWidget {
    Q_OBJECT

public:
    RoomTipsView(QWidget *parent = Q_NULLPTR);
    ~RoomTipsView();
    void SetRoomID(QString room_id);
public slots:
    void SlotOnClipboardClicked();
signals:
    void SignalCloseView();
protected:
    void leaveEvent(QEvent *event);
private:
    void InitUI();
private:
    Ui::RoomTipsView ui;
    QString room_id_;
};
