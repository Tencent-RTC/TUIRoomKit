#pragma once

#include <QWidget>
#include "ui_SmallTopBarController.h"

class SmallTopBarController : public QWidget
{
    Q_OBJECT

public:
    SmallTopBarController(QWidget *parent = Q_NULLPTR);
    ~SmallTopBarController();
public slots:
    void SlotStopSharing();
signals:
    void SignalCloseWnd();
    void SignalStopSharing();
    void SignalShowTopBar();
protected:
    bool eventFilter(QObject *obj, QEvent *event);
    void showEvent(QShowEvent* event);
    void closeEvent(QCloseEvent *event);
    void paintEvent(QPaintEvent* event);
private:
    Ui::SmallTopBarController ui;
};
