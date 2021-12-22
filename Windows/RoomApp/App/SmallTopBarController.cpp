#include "SmallTopBarController.h"
#include <QApplication>
#include <QDesktopWidget>
#include <QEvent>
#include <QPainter>
#include <QPushButton>
#include "TUIRoomCore.h"
#include "CommonDef.h"
#include "DataStore.h"

SmallTopBarController::SmallTopBarController(QWidget *parent)
    : QWidget(parent) {
    ui.setupUi(this);
    ui.label_sharing_name->installEventFilter(this);

    connect(ui.sharing_stop, &QPushButton::clicked, this, &SmallTopBarController::SlotStopSharing);

    LOAD_STYLE_SHEET(":/TopBarController/SmallTopBarController.qss");
}

SmallTopBarController::~SmallTopBarController() {
}
bool SmallTopBarController::eventFilter(QObject *obj, QEvent *event) {
    if (event->type() == QEvent::Enter && ui.label_sharing_name == obj) {
        emit SignalShowTopBar();
        this->hide();
    }

    return QWidget::eventFilter(obj, event);
}
void SmallTopBarController::paintEvent(QPaintEvent* event) {
    QPainter painter(this);
    painter.setRenderHint(QPainter::Antialiasing);
    painter.setRenderHints(QPainter::SmoothPixmapTransform, true);
    painter.setBrush(QBrush(QColor("#1C2131")));
    painter.setPen(Qt::transparent);
    QRect rect = this->rect();
    rect.setWidth(rect.width());
    rect.setHeight(rect.height());
    painter.drawRoundedRect(rect, 5, 5);

    return QWidget::paintEvent(event);
}
void SmallTopBarController::showEvent(QShowEvent* event) {
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user == nullptr) {
        return;
    }
    std::string user_name;
    local_user->user_name.length() > 0 ? user_name = local_user->user_name : user_name = local_user->user_id;
    ui.label_sharing_name->setText(tr("%1 is sharing...").arg(QString::fromStdString(user_name)));
}
void SmallTopBarController::closeEvent(QCloseEvent *event) {
    emit SignalCloseWnd();
}
void SmallTopBarController::SlotStopSharing() {
    emit SignalStopSharing();
}