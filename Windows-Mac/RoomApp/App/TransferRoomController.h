#ifndef __TRANSFERROOMCONTROLLER__
#define __TRANSFERROOMCONTROLLER__

#include <QDialog>
#include <string>
#include "ui_TransferRoomController.h"
#include "ViewDragger.h"

#include "ui_TransferUserItem.h"
class TransferUserItem : public QWidget{
    Q_OBJECT
public:
    TransferUserItem(QWidget* parent = nullptr) {
        ui.setupUi(this);
        connect(ui.btn_transferAndExit, &QPushButton::clicked, this, [=]() {
            emit SignalTransferAndExit(user_id_);
        });
    }
    ~TransferUserItem() {};
    void SetItemInfo(QString user_id, QString user_name) {
        user_id_ = user_id;
        ui.lb_name->setText(user_name);
        ui.lb_name->setToolTip(user_name);
    }
    QString GetItemUserId() {
        return user_id_;
    }
signals:
    void SignalTransferAndExit(QString user_id);
private:
    Ui::TransferUserItem ui;
    QString user_id_;
};

class TransferRoomController : public QDialog {
    Q_OBJECT
public:
    TransferRoomController(QWidget* parent);
    ~TransferRoomController();
public slots:
    void SlotOnRemoteUserOnStage(const QString& user_id);
    void SlotOnRemoteUserLeaveRoom(const QString& user_id);
signals:
    void SignalCloseWindow();
protected:
    void mouseMoveEvent(QMouseEvent* event);
    void mousePressEvent(QMouseEvent* event);
    void mouseReleaseEvent(QMouseEvent* event);
    void showEvent(QShowEvent *event);
private:
    void InitUi();
    void InitConnect();
    void InitMemberList();
    void TransferRoomMaster(std::string user_id);
    bool IsUserInRoom(const std::string& user_id);

    std::string new_master_id_;
    Ui::TransferRoomController ui_;
    ViewDragger view_dragger_;
};

#endif //  !__TRANSFERROOMCONTROLLER__