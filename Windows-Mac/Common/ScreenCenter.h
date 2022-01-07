#pragma once

#include <QObject>
#include <mutex>
#include <vector>
#include <QScreen>

class ScreenCenter : public QObject
{
    Q_OBJECT

public:
    static ScreenCenter* Instance();

    void ChangeCurreetScreen(int index);
    double GetScaleByDpi(double dpi);
    double GetCurrentScale();
    double GetCurrentWidthScale();
    double GetCurrentHeightScale();
    QSize GetCurrentScreenSize();
    void GetAllScreens();

private:
    ScreenCenter(QObject *parent = nullptr);
    ~ScreenCenter();

    void SetCurrentScale();

    static ScreenCenter* instance_ ;
    static std::mutex instance_mutex_;

    std::vector<QScreen*> screen_list_;
    QScreen* current_screen_ = nullptr;
    QScreen* last_screen_ = nullptr;
    double current_screen_width_scale_ = 1;
    double current_screen_height_scale_ = 1;
};
