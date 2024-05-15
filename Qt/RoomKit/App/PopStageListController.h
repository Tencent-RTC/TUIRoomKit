#pragma once

#include <QWidget>
#include "ui_PopStageListController.h"
#include <QLayout>
#include "ViewDragger.h"

class PopStageListController : public QWidget
{
    Q_OBJECT

public:
    PopStageListController(QWidget *parent = Q_NULLPTR);
    ~PopStageListController();

    void AddLayout(QLayout* layout);
signals:
    void SignalMoveWindow();

public slots:
    void SlotPopStageSizeChanged(int width, int height);
protected:
    void mouseMoveEvent(QMouseEvent* event);
    void mousePressEvent(QMouseEvent* event);
    void mouseReleaseEvent(QMouseEvent* event);
    void closeEvent(QCloseEvent* event);
    void resizeEvent(QResizeEvent* event);
private:
    Ui::PopStageListController ui;
    ViewDragger view_dragger_;
    int     normal_height_;
    QPushButton    expand_button_;
};
