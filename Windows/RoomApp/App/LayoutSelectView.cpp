#include "LayoutSelectView.h"
#include "CommonDef.h"
#include <QEvent>

LayoutSelectView::LayoutSelectView(QWidget *parent)
    : QWidget(parent)
{
    ui.setupUi(this);
    setWindowFlags(windowFlags() | Qt::FramelessWindowHint | Qt::Tool);

    this->installEventFilter(this);
    ui.widget_right_layout->installEventFilter(this);
    ui.widget_top_layout->installEventFilter(this);

    ui.widget_lecturer_title->hide();

    button_select_flag_.setParent(this);
    button_select_flag_.setObjectName("btn_select_flag");
    button_select_flag_.resize(25, 25);
    button_select_flag_.hide();

    connect(ui.btn_right, &QPushButton::clicked, this, &LayoutSelectView::SlotOnRightLayoutClicked);
    qRegisterMetaType<StageListDirection>("StageListDirection");
    connect(ui.btn_top, &QPushButton::clicked, this, &LayoutSelectView::SlotOnTopLayoutClicked);

    LOAD_STYLE_SHEET(":/LayoutSelectView/LayoutSelectView/LayoutSelectView.qss");
}

LayoutSelectView::~LayoutSelectView()
{
}

bool LayoutSelectView::eventFilter(QObject* obj, QEvent* event) {
    if (obj == this && event->type() == QEvent::Leave) {
        emit SignalCloseView();
    }
    else if (obj == ui.widget_right_layout && event->type() == QEvent::Enter) {
        button_select_flag_.setParent(ui.widget_right_layout);
        button_select_flag_.move(ui.widget_right_layout->width() - 25, 0);
        button_select_flag_.show();
    }
    else if (obj == ui.widget_top_layout && event->type() == QEvent::Enter) {
        button_select_flag_.setParent(ui.widget_top_layout);
        button_select_flag_.move(ui.widget_top_layout->width() - 25, 0);
        button_select_flag_.show();
    }
    else if (event->type() == QEvent::Leave) {
        button_select_flag_.hide();
    }

    return QWidget::eventFilter(obj, event);
}
void LayoutSelectView::SlotOnRightLayoutClicked() {
    emit SignalStageListLayoutChanged(StageListDirection::kVerDirection);
}
void LayoutSelectView::SlotOnTopLayoutClicked() {
    emit SignalStageListLayoutChanged(StageListDirection::kHorDirection);
}
