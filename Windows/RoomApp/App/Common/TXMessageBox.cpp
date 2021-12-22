#include "TXMessageBox.h"
#include <QBitmap>
#include <QPainter>
#include <QTimer>

TXMessageBox* TXMessageBox::dialog_instance_ = nullptr;
TXMessageBox* TXMessageBox::text_instance_ = nullptr;
TXMessageBox::TXMessageBox()
    : QDialog(NULL)
    , button_type_(TXMessageType::kNoButton)
    , view_dragger_(this) {
    ui.setupUi(this);
    this->setWindowFlags(windowFlags() | Qt::FramelessWindowHint | Qt::Popup | Qt::WindowStaysOnTopHint);

    QString sheet = "QLabel#label_title{font-weight:bold;font-size:16px;}\
                    QLabel#label_content{font-size:14px;}\
                    QPushButton#btn_close{background:transparent; border:none; padding:0px; \
                    border-image: url(:/MainWindow/MainWindow/close.png);}\
                    QPushButton#btn_cancel{\
                        border: 2px solid #D3D3D3;\
                        padding: 4px;\
                        min-height: 12px;\
                        color: black;\
                        background: transparent;\
                        border-radius:5px;\
                    }\
                    QPushButton#btn_cancel:pressed {\
                        background-color: transparent;\
                        border-color: #6D727D;\
                        color: 	black;\
                    }\
                    QPushButton#btn_cancel:hover {\
                        background-color: transparent;\
                        border-color: #6D727D;\
                    }\
                    QPushButton {\
                        border: 2px solid #2F79FF;\
                        padding: 4px;\
                        min-height: 12px;\
                    	color: #FFFFFF;\
                    	background: #2F79FF;\
                    	border-radius:5px;\
                    	height: 20px;\
	                    font-size: 14px;\
                        font-family: \"Microsoft YaHei\";\
                    }\
                    QPushButton:pressed {\
                        background-color: #0A64FF;\
                        border-color: #0A64FF;\
                        color: 	#FFFFFF;\
                    }\
                    QPushButton:hover {\
                        background-color: #0A64FF;\
                        border-color: #0A64FF;\
                    	color: 	#FFFFFF;\
                    }";
    this->setStyleSheet(sheet);

    connect(ui.btn_close, &QPushButton::clicked, this, [=]() {
        this->close();
        if (button_type_ == TXMessageType::kNoButton) {
            delete text_instance_;
            text_instance_ = nullptr;
        } else {
            delete dialog_instance_;
            dialog_instance_ = nullptr;
        }
    });
    connect(ui.btn_ok, &QPushButton::clicked, this, &TXMessageBox::OnBtnClicked);
    connect(ui.btn_cancel, &QPushButton::clicked, this, &TXMessageBox::OnBtnClicked);
    connect(ui.btn_leave_room, &QPushButton::clicked, this, &TXMessageBox::OnBtnClicked);
    connect(ui.btn_destory_room, &QPushButton::clicked, this, &TXMessageBox::OnBtnClicked);

    timer_.setSingleShot(true);
    connect(&timer_, &QTimer::timeout, this, [=]() {
        this->close();
        delete text_instance_;
        text_instance_ = nullptr;
    });
}

TXMessageBox::~TXMessageBox(){
}
TXMessageBox& TXMessageBox::Instance() {
    if (text_instance_ == nullptr) {
        text_instance_ = new TXMessageBox;
    }
    return *text_instance_;
}
void TXMessageBox::AddLineTextMessage(QString content_text, QString title) {
    if (text_instance_ == nullptr)
        return;

    if (button_type_ == TXMessageType::kNoButton) {
        ui.btn_ok->hide();
        ui.btn_cancel->hide();
        ui.btn_leave_room->hide();
        ui.btn_destory_room->hide();
        if (title.isEmpty()) {
            ui.label_title->hide();
            this->setMaximumHeight(80);
        } else {
            ui.label_title->show();
            this->setMaximumHeight(150);
            ui.label_title->setText(title);
        }

        ui.label_content->setText(content_text);
        this->show();
        this->raise();
        timer_.start(5000);
    }
}

TXMessageBox& TXMessageBox::DialogInstance() {
    if (dialog_instance_ == nullptr) {
        dialog_instance_ = new TXMessageBox;
    }
    return *dialog_instance_;
}
void TXMessageBox::ShowMultiButtonDialog(int button_type, QString content_text, QString title_text) {
    if (dialog_instance_ == nullptr)
        return;

    if (!title_text.isEmpty()) {
        ui.label_title->show();
        ui.label_title->setText(title_text);
    } else {
        ui.label_title->hide();
    }

    button_type_ = button_type;
    ui.btn_ok->setVisible(button_type & TXMessageType::kOk);
    ui.btn_cancel->setVisible(button_type & TXMessageType::kCancel);
    ui.btn_leave_room->setVisible(button_type & TXMessageType::kLeaveRoom);
    ui.btn_destory_room->setVisible(button_type & TXMessageType::kDestoryRoom);

    ui.label_content->setText(content_text);
    this->show();
    this->raise();
}
void TXMessageBox::OnBtnClicked() {
    QObject* obj = sender();
    if (obj == ui.btn_cancel) {
        emit SignalCancel();
    }
    else if (obj == ui.btn_ok) {
        emit SignalOk();
    }
    else if (obj == ui.btn_leave_room) {
        emit SignalLeaveRoom();
    }
    else if (obj == ui.btn_destory_room) {
        emit SignalDestoryRoom();
    }
    button_type_ = TXMessageType::kNoButton;
    QDialog::accept();
    delete dialog_instance_;
    dialog_instance_ = nullptr;
}
void TXMessageBox::mouseMoveEvent(QMouseEvent* event) {
    view_dragger_.mouseMove(event);
    QDialog::mouseMoveEvent(event);
}
void TXMessageBox::mousePressEvent(QMouseEvent* event) {
    view_dragger_.mousePress(event);
    QDialog::mousePressEvent(event);
}
void TXMessageBox::mouseReleaseEvent(QMouseEvent* event) {
    view_dragger_.mouseRelease(event);
    QDialog::mouseReleaseEvent(event);
}
void TXMessageBox::showEvent(QShowEvent* event) {
    QBitmap bmp(this->size());
    bmp.fill();
    QPainter p(&bmp);
    p.setPen(Qt::NoPen);
    p.setBrush(Qt::black);
    p.drawRoundedRect(bmp.rect(), 5, 5);
    setMask(bmp);

    QDialog::showEvent(event);
}
