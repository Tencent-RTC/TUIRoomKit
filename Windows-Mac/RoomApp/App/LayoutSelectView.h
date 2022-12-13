#pragma once

#include <QWidget>
#include "ui_LayoutSelectView.h"
#include "CommonDef.h"

class LayoutSelectView : public QWidget
{
    Q_OBJECT

public:
    LayoutSelectView(QWidget *parent = Q_NULLPTR);
    ~LayoutSelectView();
public slots:
    void SlotOnRightLayoutClicked();
    void SlotOnTopLayoutClicked();
    void SlotOnGridLayoutClicked();
signals:
    void SignalStageListLayoutChanged(StageListDirection direction);
    void SignalCloseView();
protected:
    bool eventFilter(QObject* obj, QEvent* event);
private:
    Ui::LayoutSelectView ui;
    QPushButton button_select_flag_;
};
