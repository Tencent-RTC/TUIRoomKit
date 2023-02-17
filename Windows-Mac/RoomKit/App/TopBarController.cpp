#include "TopBarController.h"
#include "TUIRoomCore.h"
#include "MessageDispatcher/MessageDispatcher.h"
#include "StatusUpdateCenter.h"

TopBarController::TopBarController(QWidget *parent)
    : QWidget(parent)
    , net_quality_(tr("Unknow"))
{
    ui.setupUi(this);

    ui.btn_network->installEventFilter(this);

    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnNetworkQuality, this, &TopBarController::OnNetQuality);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnStatistics, this, &TopBarController::OnNetStatistics);

    connect(ui.btn_set, &QPushButton::clicked, this, [=]() {
        emit SignalShowSetting(0);
    });
    connect(ui.btn_switch_layout, &QPushButton::clicked, this, &TopBarController::SlotOnSwitchLayout);
    connect(ui.btn_roomInfo, &QPushButton::clicked, this, &TopBarController::SlotOnRoomInfoView);
    ui.btn_roomInfo->setToolTip(tr("Display app information"));

    TUIRoomCore::GetInstance()->ShowDebugView(0);
    ui.btn_ShowDebugInfo->setToolTip(tr("Show Debug View"));
    connect(ui.btn_ShowDebugInfo, &QPushButton::clicked, this, [=](bool checked) {
        if (checked) {
            TUIRoomCore::GetInstance()->ShowDebugView(1);
            ui.btn_ShowDebugInfo->setToolTip(tr("Close Debug View"));
        } else {
            TUIRoomCore::GetInstance()->ShowDebugView(0);
            ui.btn_ShowDebugInfo->setToolTip(tr("Show Debug View"));
        }
    });

    this->setAttribute(Qt::WA_TranslucentBackground, false);
    
    LOAD_STYLE_SHEET(":/TopBarController/TopBarController.qss");
}

TopBarController::~TopBarController(){
    DELETE_OBJECT(layout_select_view_);
}

void TopBarController::SetRoomID(const std::string& room_id) {
    ui.label_room_name->setText(QString::fromStdString(room_id));
}
bool TopBarController::eventFilter(QObject *obj, QEvent *event) {
    if (event->type() == QEvent::Enter) {
        if (obj == ui.btn_network) {
            QString net_info = QString(tr("delay: %1ms\ndownloss: %2%\nCPU: %3%\nNetStatus: %4"))\
                .arg(net_tooltip_.rtt).arg(net_tooltip_.downLoss).arg(net_tooltip_.app_cpu).arg(net_quality_);
            ui.btn_network->setToolTip(net_info);
        }
    }

    return QWidget::eventFilter(obj, event);
}
void TopBarController::OnNetStatistics(const liteav::TRTCStatistics& statis) {
    // ��ǰApp CPUռ����
    int app_cpu = statis.appCpu;
    // ������ʱ
    int rtt = statis.rtt;
    // ���ж�����
    int downLoss = statis.downLoss;

    net_tooltip_.app_cpu = app_cpu;
    net_tooltip_.rtt = rtt;
    net_tooltip_.downLoss = downLoss;
}
void TopBarController::OnNetQuality(UserNetQualityInfo local_user_quality, std::vector<UserNetQualityInfo> remote_users_quality) {
        switch (local_user_quality.quality) {
        case liteav::TRTCQuality_Unknown:
            net_quality_ = tr("Unknow");
            ui.btn_network->setStyleSheet("QPushButton{border-image: url(:/MainWindow/MainWindow/network.png);}");
            break;
        case liteav::TRTCQuality_Excellent:
            net_quality_ = tr("Excellent");
            ui.btn_network->setStyleSheet("QPushButton{border-image: url(:/MainWindow/MainWindow/net_full.png);}");
            break;
        case liteav::TRTCQuality_Good:
            net_quality_ = tr("Good");
            ui.btn_network->setStyleSheet("QPushButton{border-image: url(:/MainWindow/MainWindow/net_good.png);}");
            break;
        case liteav::TRTCQuality_Poor:
            net_quality_ = tr("Poor");
            ui.btn_network->setStyleSheet("QPushButton{border-image: url(:/MainWindow/MainWindow/net_poor.png);}");
            break;
        case liteav::TRTCQuality_Bad:
            net_quality_ = tr("Bad");
            ui.btn_network->setStyleSheet("QPushButton{border-image: url(:/MainWindow/MainWindow/net_normal.png);}");
            break;
        case liteav::TRTCQuality_Vbad:
            net_quality_ = tr("Very bad");
            ui.btn_network->setStyleSheet("QPushButton{border-image: url(:/MainWindow/MainWindow/net_normal.png);}");
            break;
        case liteav::TRTCQuality_Down:
            net_quality_ = tr("Down");
            ui.btn_network->setStyleSheet("QPushButton{border-image: url(:/MainWindow/MainWindow/net_bad.png);}");
            break;
        }

        //net_tooltip_.app_cpu = app_cpu;
        net_tooltip_.rtt = local_user_quality.delay;
        net_tooltip_.downLoss = local_user_quality.downLoss;
}
void TopBarController::SlotOnSwitchLayout() {
    if (layout_select_view_ == nullptr) {
        layout_select_view_ = new LayoutSelectView(NULL);
        connect(layout_select_view_, &LayoutSelectView::SignalStageListLayoutChanged, this, [=](StageListDirection direction){
            emit StatusUpdateCenter::Instance().SignalStageListLayoutChanged(direction);
            SlotCloseSelectView();
        });
        connect(layout_select_view_, &LayoutSelectView::SignalCloseView, this, &TopBarController::SlotCloseSelectView);
    }
    layout_select_view_->resize(500, 200);
    layout_select_view_->move(QCursor::pos().x() - layout_select_view_->width(), QCursor::pos().y() + 10);
    layout_select_view_->show();
    layout_select_view_->raise();
}

void TopBarController::SlotCloseSelectView() {
    if (layout_select_view_ != nullptr) {
        layout_select_view_->close();
        layout_select_view_->deleteLater();
        layout_select_view_ = nullptr;
    }
}

void TopBarController::SlotOnRoomInfoView() {
    if (room_tips_view_ == nullptr) {
        room_tips_view_ = new RoomTipsView(NULL);
        room_tips_view_->SetRoomID(ui.label_room_name->text());
        connect(room_tips_view_, &RoomTipsView::SignalCloseView, this, &TopBarController::SlotCloseRoomTipsView);
    }
    room_tips_view_->move(QCursor::pos().x() - 20, QCursor::pos().y() + 15);
    room_tips_view_->show();
    room_tips_view_->raise();
}
void TopBarController::SlotCloseRoomTipsView() {
    if (room_tips_view_ != nullptr) {
        room_tips_view_->close();
        room_tips_view_->deleteLater();
        room_tips_view_ = nullptr;
    }
}
