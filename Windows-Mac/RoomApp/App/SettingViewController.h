#ifndef __SETTING_VIEW_CONTROL_H__
#define __SETTING_VIEW_CONTROL_H__

#include <QWidget>
#include <QFile>
#include <QMovie>
#include <QDialog>
#include <QStyledItemDelegate>
#include "TRTCTypeDef.h"
#include "ITRTCStatistics.h"
#include "CommonDef.h"

#include "ViewDragger.h"
#include "ui_SettingViewController.h"

class SettingViewController : public QWidget
{
    Q_OBJECT

public:
    SettingViewController(QWidget *parent = Q_NULLPTR);
    ~SettingViewController();

    // index为0-4：0视频 1美颜 2声音 3统计
    void SetCurrentPage(int index);
signals:
    void SignalClose();
protected:
    void mouseMoveEvent(QMouseEvent* event);
    void mousePressEvent(QMouseEvent* event);
    void mouseReleaseEvent(QMouseEvent* event);
    void showEvent(QShowEvent *event);
private slots:
    void OnTabClicked(bool checked);
    void OnClose();
    void CameraCurrentIndexChanged(int index);
    void MicCurrentIndexChanged(int index);
    void SpeakerCurrentIndexChanged(int index);
    void OnTestMic();
    void OnTestSpeaker();

    void OnMirrorClicked(bool checked);
    void OnBeautyClicked(bool checked);
    void OnBuffingValueChanged(int value);
    void OnWhiteningValueChanged(int value);
    void OnRadioButtonChanged();

    void OnMicrophoneValueChanged(int value);
    void OnSpeakerValueChanged(int value);

    void OnStatistics(const liteav::TRTCStatistics& statis);
    void OnNetQuality(UserNetQualityInfo local_user_quality, std::vector<UserNetQualityInfo> remote_users_quality);
private:
    void InitUi();
    void InitConnect();
    void ResetDeviceList(const QString& deviceId, TXMediaDeviceType type, TXMediaDeviceState state);

    int GetAppMemoryUsage();
    void GetTotalMemory();
private:
    Ui::SettingViewController ui;
    ViewDragger view_dragger_;
    QStyledItemDelegate* item_delegate_ = nullptr;

    QMovie *movie_;
};

#endif  //  !__SETTING_VIEW_CONTROL_H__
