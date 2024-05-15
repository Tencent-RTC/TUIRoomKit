#include "ScreenShareItem.h"
#include <QPainter>
#include <QBitmap>
#include "CommonDef.h"

ScreenShareItem::ScreenShareItem(QWidget *parent, bool default_checked)
    : QWidget(parent) {
    ui.setupUi(this);

    connect(&ckbox_, SIGNAL(stateChanged(int)), this, SLOT(OnCheckedChanged(int)));
    if (!default_checked)
        this->setStyleSheet("QWidget#widget_bg{background:#1C2131;border:0px solid white;border-radius:6px;}\
                            QWidget{background:transparent;border:none;}");
    else
        this->UpdateStyle(true);
}

ScreenShareItem::~ScreenShareItem() {
}
void ScreenShareItem::SetInfo(void* source_id, IScreenShareManager::ScreenCaptureSourceType type, QString name, QPixmap img) {
    info_.source_id = source_id;
    info_.type = type;
    info_.source_name = name.toStdString();

    QFontMetrics fontWidth(ui.lb_name->font());
    int w = ui.wgt_name->width();
    int wx = ui.wgt_img->width();
    QString elide_name = fontWidth.elidedText(name, Qt::ElideRight, kShareItemWidth - 20);
    ui.lb_name->setText(elide_name);
    ui.lb_name->setToolTip(name);
    img_ = img;

    if (!img_.isNull()) {
        ui.lb_image->setPixmap(img_);
        ui.lb_image->setAlignment(Qt::AlignCenter);

        ckbox_.setParent(ui.lb_image);
        ckbox_.move(5, 5);
        ckbox_.show();
    }
}

void ScreenShareItem::leaveEvent(QEvent *event) {
    if (!ckbox_.isChecked())
        this->setStyleSheet("QWidget#widget_bg{background:#1C2131;border:0px solid white;border-radius:6px;}");

    QWidget::leaveEvent(event);
}
void ScreenShareItem::enterEvent(QEvent *event) {
    if (!ckbox_.isChecked())
        this->setStyleSheet("QWidget#widget_bg{background:#2F79FF;border:1px solid white;border-radius:6px;}");

    QWidget::enterEvent(event);
}
void ScreenShareItem::mousePressEvent(QMouseEvent *event) {
    this->UpdateStyle(!ckbox_.isChecked());

    QWidget::mousePressEvent(event);
}
bool ScreenShareItem::IsChecked() {
    return ckbox_.isChecked();
}
IScreenShareManager::ScreenCaptureSourceInfo ScreenShareItem::GetInfo() {
    return info_;
}
void ScreenShareItem::OnCheckedChanged(int state) {
    bool bChecked = ckbox_.isChecked();
    emit SignalChecked(info_.source_id, bChecked);
}
void ScreenShareItem::UpdateStyle(bool bSelected) {
    if (bSelected)
        this->setStyleSheet("QWidget#widget_bg{background:#2F79FF;border:1px solid white;border-radius:6px;}");
    else
        this->setStyleSheet("QWidget#widget_bg{background:#1C2131;border:0px solid white;border-radius:6px;}");

    ckbox_.setChecked(bSelected);
}
