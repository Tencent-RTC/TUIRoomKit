#pragma once

#include <QWidget>
#include <QMovie>
#include <QStyledItemDelegate>
#include "ViewDragger.h"
#include "ui_PresetDeviceController.h"
#include "TUIRoomDef.h"

class PresetDeviceController : public QWidget
{
    Q_OBJECT

public:
    PresetDeviceController(QWidget *parent = Q_NULLPTR);
    ~PresetDeviceController();

    void InitUi();
    void StartPreview();
    void OnCloseWnd();
    void ResetStart();

    void MoveEvent(QMouseEvent* event);
    void PressEvent(QMouseEvent* event);
    void ReleaseEvent(QMouseEvent* event);

public slots:
    void CameraCurrentIndexChanged(int index);
    void MicCurrentIndexChanged(int index);
    void SpeakerCurrentIndexChanged(int index);
    void OnTestMic();
    void OnTestSpeaker();

    void OnMirrorClicked(bool checked);
    void OnMicrophoneValueChanged(int value);
    void OnSpeakerValueChanged(int value);

    void OnBeautyClicked(bool checked);
    void OnBuffingValueChanged(int value);
    void OnWhiteningValueChanged(int value);
    void OnRadioButtonChanged();
signals:
    void SignalCloseWnd();
    void SignalEndDetection();
protected:
    void showEvent(QShowEvent *event);
private:
    void InitConnect();
    void ResetDeviceList(const QString& deviceId, liteav::TXMediaDeviceType type, liteav::TXMediaDeviceState state);

private:
    Ui::PresetDeviceController ui;
    QStyledItemDelegate* item_delegate_ = nullptr;
    QMovie *movie_;
};
