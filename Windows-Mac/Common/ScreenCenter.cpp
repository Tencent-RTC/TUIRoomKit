#include "ScreenCenter.h"
#include <QGuiApplication>
#include <QDebug>

ScreenCenter* ScreenCenter::instance_ = nullptr;
std::mutex ScreenCenter::instance_mutex_;

const int kScreenScale = 96;

ScreenCenter* ScreenCenter::Instance() {
    if (instance_ == nullptr) {
        std::lock_guard<std::mutex> lock(instance_mutex_);
        if (instance_ == nullptr) {
            instance_ = new ScreenCenter;
        }
    }
    return instance_;
}

ScreenCenter::ScreenCenter(QObject *parent)
    : QObject(parent) {
}

ScreenCenter::~ScreenCenter() {

}

void ScreenCenter::GetAllScreens() {
    screen_list_.clear();
    current_screen_ = nullptr;
    QList<QScreen*> screens = QGuiApplication::screens();
    for (int i = 0; i < screens.size(); ++i) {
        screen_list_.push_back(screens.at(i));
        qDebug() << QString("screen %0, physicalDotsPerInchX : %1,logicalDotsPerInch :%2, screen width: %3,screen height :%4")
            .arg(screens.at(i)->name()).arg(screens.at(i)->physicalDotsPerInch()).arg(screens.at(i)->logicalDotsPerInch())
            .arg(screens.at(i)->size().width()).arg(screens.at(i)->size().height());
    }

    current_screen_ = QGuiApplication::primaryScreen();
}

void ScreenCenter::SetCurrentScale() {
    if (current_screen_ != nullptr && last_screen_ != nullptr) {
        current_screen_width_scale_ = static_cast<double>(current_screen_->size().width()) / last_screen_->size().width();
        current_screen_height_scale_ = static_cast<double>(current_screen_->size().height()) / last_screen_->size().height();
    }
}

void ScreenCenter::ChangeCurreetScreen(int index) {
    if (index < 0 || index >= screen_list_.size()) {
        return;
    }
    last_screen_ = current_screen_;
    current_screen_ = screen_list_.at(index);
    SetCurrentScale();
}

double ScreenCenter::GetScaleByDpi(double dpi) {
    double scale = dpi / kScreenScale;
    if (scale <= 1.5) {
        return 1;
    } else if (scale <= 2.5) {
        return 1.5;
    } else {
        return 2;
    }
}

double ScreenCenter::GetCurrentScale() {
    if (current_screen_ == nullptr) {
        return 1;
    }
    double screen_scale = current_screen_->logicalDotsPerInch() / kScreenScale;
    return GetScaleByDpi(screen_scale);
}

double ScreenCenter::GetCurrentWidthScale() {
    return current_screen_width_scale_;
}

double ScreenCenter::GetCurrentHeightScale() {
    return current_screen_height_scale_;
}

QSize ScreenCenter::GetCurrentScreenSize() {
    QSize screen_size;
    if (current_screen_ != nullptr) {
        screen_size = current_screen_->availableSize();
    }
    return screen_size;
}