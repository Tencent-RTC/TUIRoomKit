#ifndef __SCREEN_SHARE_WINDOW_H__
#define __SCREEN_SHARE_WINDOW_H__

#include <QDialog>
#include "ui_ScreenShareWindow.h"
#include "Common/ViewDragger.h"

#include "IScreenShareManager.h"
#include "ScreenShareItem.h"

class ScreenShareWindow : public QDialog {
    Q_OBJECT

public:
    ScreenShareWindow(QWidget *parent = Q_NULLPTR);
    ~ScreenShareWindow();

    void InitShow(const std::vector<IScreenShareManager::ScreenCaptureSourceInfo>& source_info);
public slots:
    void OnOK();
    void OnClose();
    std::vector<IScreenShareManager::ScreenCaptureSourceInfo> GetSelected();
    void OnSelectChanged(void* source_id, bool bChecked);
    void OnVideoFluencyPreferred(bool checked);
signals:
    void SignalConfirmShareScreen(bool confirm);
protected:
    virtual void mouseMoveEvent(QMouseEvent* event);
    virtual void mousePressEvent(QMouseEvent* event);
    virtual void mouseReleaseEvent(QMouseEvent* event);
    virtual void showEvent(QShowEvent* event);
private:
    void LayoutScreen(const std::vector<IScreenShareManager::ScreenCaptureSourceInfo>& source_info);
    void LayoutWindow(const std::vector<IScreenShareManager::ScreenCaptureSourceInfo>& source_info);
    void ClearLayoutData();
private:
    Ui::ScreenShareWindow ui;
    ViewDragger view_dragger_;
    QGridLayout* pLayout_ = nullptr;
    QGridLayout* pScreenLayout_ = nullptr;
    std::vector<ScreenShareItem*> vec_item_;
    std::vector<QWidget*> vec_null_item_;
    void* last_selected_source_id = nullptr;
};

#endif  //  !__SCREEN_SHARE_WINDOW_H__
