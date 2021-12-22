#ifndef __TX_MESSAGEBOX_H__
#define __TX_MESSAGEBOX_H__

#include <QDialog>
#include <QTimer>
#include "ui_TXMessageBox.h"
#include "ViewDragger.h"
#include "../CommonDef.h"

/// You can use the following methods to create a message box£º
/// <pre>
///    create a no button message box like:
///    TXMessageBox::Instance().AddLineTextMessage(tr("This is a test line message."));
///
///    or create a ok/cancel message box like:
///    TXMessageBox::DialogInstance().ShowMultiButtonDialog(kOk | kCancel, \
///                tr("Are you sure operate ?"));
///
///    or create a cancel/leave class/class over message box like:
///    TXMessageBox::DialogInstance().ShowMultiButtonDialog(kCancel | kDestoryRoom | kLeaveRoom, \
///                tr("Are you sure to operate ?"));
/// </pre>
///

class TXMessageBox final: public QDialog {
    Q_OBJECT

public:
    static TXMessageBox& Instance();
    void AddLineTextMessage(QString content_text, QString title = "");

    static TXMessageBox& DialogInstance();
    void ShowMultiButtonDialog(int button_type, QString content_text, QString title_text = "");

private slots:
    void OnBtnClicked();
signals:
    void SignalCancel();
    void SignalOk();
    void SignalLeaveRoom();
    void SignalDestoryRoom();
protected:
    void mouseMoveEvent(QMouseEvent* event);
    void mousePressEvent(QMouseEvent* event);
    void mouseReleaseEvent(QMouseEvent* event);
    void showEvent(QShowEvent *event);
public:
    TXMessageBox();
    ~TXMessageBox();

private:
    Ui::TXMessageBox ui;
    ViewDragger view_dragger_;
    int button_type_;
    QTimer timer_;
    static TXMessageBox* dialog_instance_;
    static TXMessageBox* text_instance_;
};

#endif  //  !__TX_MESSAGEBOX_H__
