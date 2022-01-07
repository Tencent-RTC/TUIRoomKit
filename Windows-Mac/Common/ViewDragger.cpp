#include "ViewDragger.h"
#include <QCursor>
#include <QDesktopWidget>
#include <QApplication>

ViewDragger::ViewDragger(QWidget* parent)
	: bind_widget_(parent)
	, is_pressed_(false) {
}

ViewDragger::~ViewDragger() {
}

void ViewDragger::mouseMove(QMouseEvent* event) {
    if (bind_widget_ == nullptr)
        return;
	if (is_pressed_ && !bind_widget_->isMaximized() && !bind_widget_->isMinimized() && !bind_widget_->isFullScreen()) {
		int move_x = event->pos().x() - last_pos_.x();
		int move_y = event->pos().y() - last_pos_.y();
		bind_widget_->move(bind_widget_->pos().x() + move_x, bind_widget_->pos().y() + move_y);
	}
    if (bind_widget_->geometry().top() < 0) {
        //int move_y = 0 - bind_widget_->geometry().top();
        //bind_widget_->move(bind_widget_->pos().x(), bind_widget_->pos().y() + move_y);
    }
}

void ViewDragger::mousePress(QMouseEvent* event) {
	if (event->pos().y() < 50) {
		is_pressed_ = true;
		last_pos_ = event->pos();
	}
}

void ViewDragger::mouseRelease(QMouseEvent* event) {
    if (bind_widget_ == nullptr)
        return;
	is_pressed_ = false;
    bind_widget_->setCursor(QCursor(Qt::ArrowCursor));
}

void ViewDragger::mouseDoubleClick(QMouseEvent* event) {
    if (bind_widget_ == nullptr)
        return;

    if (event->pos().y() < 50) {
        if (bind_widget_->isMaximized()) {
            bind_widget_->showNormal();
        } else {
            bind_widget_->showMaximized();
        }
    }
}
