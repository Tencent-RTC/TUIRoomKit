#include "PopStageListController.h"
#include "CommonDef.h"
#include <QDesktopWidget>
#include <QToolTip>

PopStageListController::PopStageListController(QWidget *parent)
    : QWidget(parent)
    , view_dragger_(this) {
    ui.setupUi(this);

    ui.btn_max->hide();
    ui.btn_min->hide();
    expand_button_.installEventFilter(this);

    connect(ui.btn_min, &QPushButton::clicked, this, [=](bool checked) {
        if (checked) {
            normal_height_ = this->height();
            this->setFixedHeight(50);
            ui.widget_content->hide();
        } else {
            this->setFixedHeight(normal_height_);
            ui.widget_content->show();
            QDesktopWidget* desk = QApplication::desktop();
            QRect main_rect = desk->availableGeometry(this);
            this->move((main_rect.width() - this->width() - 10), (main_rect.height() - this->height()) / 2);
        }
    });
    connect(ui.btn_max, &QPushButton::clicked, this, [=](bool checked) {
        QDesktopWidget* desk = QApplication::desktop();
        QRect main_rect = desk->availableGeometry(this);
        if (checked) {
            normal_height_ = this->height();
            int height = main_rect.height() - 10;
            this->setFixedHeight(height);
        } else {
            this->setFixedHeight(normal_height_);
        }
        this->move((main_rect.width() - this->width() - 10), (main_rect.height() - this->height()) / 2);
    });

    expand_button_.setWindowFlags(Qt::FramelessWindowHint | Qt::Window | Qt::WindowStaysOnTopHint);
    expand_button_.setAttribute(Qt::WA_TranslucentBackground);
    expand_button_.resize(60, 40);
    // 提示：收缩到屏幕右上角 
    ui.btn_collapse->setToolTip(tr("collapse to the upper right corner of the screen"));
    QString expand_sheet = "QPushButton{ \
        	border: none; \
        	background: rgba(0,0,0,150); \
        	border-top-left-radius: 15px; \
        	border-bottom-left-radius: 15px; \
        	image-position: left; \
        	image: url(:/StageListController/StageListViewControl/left.png); \
        	padding: 10px; \
        	padding-left: 15px; \
        }\
        QPushButton:hover{ \
        	background: rgba(0,0,0,180); \
        }";
    expand_button_.setStyleSheet(expand_sheet);
    connect(ui.btn_collapse, &QPushButton::clicked, this, [=]() {
        this->hide();
        QDesktopWidget *desk = QApplication::desktop();
        QRect main_rect = desk->availableGeometry(this);
        expand_button_.move(main_rect.x() + main_rect.width() - expand_button_.width(), 150);
        expand_button_.show();
    });
    connect(&expand_button_, &QPushButton::clicked, this, [=]() {
        this->show();
        this->setFixedHeight(normal_height_);
        ui.widget_content->show();
        ui.widget_content->activateWindow();
        QDesktopWidget* desk = QApplication::desktop();
        QRect main_rect = desk->availableGeometry(this);
        this->move((main_rect.width() - this->width() - 10), (main_rect.height() - this->height()) / 2);

        expand_button_.hide();
    });

    LOAD_STYLE_SHEET(":/StageListController/StageListViewControl/PopStageListController.qss");
}
PopStageListController::~PopStageListController(){
}
void PopStageListController::AddLayout(QLayout* layout) {
    ui.widget_content->setLayout(layout);
}

void PopStageListController::SlotPopStageSizeChanged(int width, int height) {
    normal_height_ = height + 60;
    int widget_width = width + 20;
    if (ui.widget_content->isVisible()) {
        this->setFixedSize(widget_width, normal_height_);
        QDesktopWidget* desk = QApplication::desktop();
        move(this->x(), (desk->availableGeometry().height() - this->height()) / 2);
    }
}
void PopStageListController::resizeEvent(QResizeEvent* event) {
    if (!ui.btn_min->isChecked()) {
        normal_height_ = this->height();
    }
}
void PopStageListController::mouseMoveEvent(QMouseEvent* event) {
    view_dragger_.mouseMove(event);
    emit SignalMoveWindow();
    QWidget::mouseMoveEvent(event);
}
void PopStageListController::mousePressEvent(QMouseEvent* event) {
    view_dragger_.mousePress(event);
    QWidget::mousePressEvent(event);
}
void PopStageListController::mouseReleaseEvent(QMouseEvent* event) {
    view_dragger_.mouseRelease(event);
    QWidget::mouseReleaseEvent(event);
}
void PopStageListController::closeEvent(QCloseEvent *event) {
    QWidget::closeEvent(event);
}