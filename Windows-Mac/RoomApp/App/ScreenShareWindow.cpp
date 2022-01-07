#include "ScreenShareWindow.h"
#include <QLabel>
#include <QBitmap>
#include <QPainter>
#include <QDesktopWidget>
#include "CommonDef.h"
#include "DataStore.h"
#include "TUIRoomCore.h"

ScreenShareWindow::ScreenShareWindow(QWidget *parent)
    : QDialog(parent)
    , view_dragger_(this) {
    ui.setupUi(this);
    setWindowFlags(this->windowFlags() | Qt::FramelessWindowHint | Qt::Popup | Qt::WindowStaysOnTopHint);

    QBitmap bmp(this->size());
    bmp.fill();
    QPainter p(&bmp);
    p.setPen(Qt::NoPen);
    p.setBrush(Qt::black);
    p.drawRoundedRect(bmp.rect(), 5, 5);
    setMask(bmp);

    connect(ui.btn_confirm_share, SIGNAL(clicked()), this, SLOT(OnOK()));
    connect(ui.btn_close_select, SIGNAL(clicked()), this, SLOT(OnClose()));
    connect(ui.ckbox_Smooth, SIGNAL(clicked(bool)), this, SLOT(OnVideoFluencyPreferred(bool)));
    connect(ui.ckbox_share_voice, &QCheckBox::clicked, this, [](bool checked) {
        if (checked) {
            TUIRoomCore::GetInstance()->StartSystemAudioLoopback();
            DataStore::Instance()->SetShareScreenVoice(true);
        } else {
            TUIRoomCore::GetInstance()->StopSystemAudioLoopback();
            DataStore::Instance()->SetShareScreenVoice(false);
        }
    });
}

ScreenShareWindow::~ScreenShareWindow() {
}
void ScreenShareWindow::InitShow(const std::vector<IScreenShareManager::ScreenCaptureSourceInfo>& source_info) {
    LayoutScreen(source_info);
    LayoutWindow(source_info);

    ui.ckbox_share_voice->setChecked(false);
    // 画质偏好（平滑和清晰）设置
    TUIVideoQosPreference preference = DataStore::Instance()->GetQosPreference();
    if (preference == TUIVideoQosPreference::kSmooth) {
        ui.ckbox_Smooth->setChecked(true);
    }
    else {
        ui.ckbox_Smooth->setChecked(false);
    }
    this->raise();
}
void ScreenShareWindow::LayoutScreen(const std::vector<IScreenShareManager::ScreenCaptureSourceInfo>& source_info) {
    std::vector<IScreenShareManager::ScreenCaptureSourceInfo> source_screen;
    for (auto info : source_info) {
        if (info.type == IScreenShareManager::kScreen) {
            source_screen.push_back(info);
        }
    }

    int col = (this->width() - kShareItemMargin) / kShareItemWidth;
    int row = source_screen.size() / (col > 0 ? col : 1);
    if ((source_screen.size() % col) != 0)
        row += 1;

    ui.scrollArea_desktop->setHorizontalScrollBarPolicy(Qt::ScrollBarAlwaysOff);
    ui.scrollArea_desktop->setVerticalScrollBarPolicy(Qt::ScrollBarAsNeeded);
    
    ui.scrollAreaWidget_desktop->setFixedSize(col * kShareItemWidth + (col - 1) * kShareItemSpace, row * kShareItemHeight + (row - 1) * kShareItemSpace);
    pScreenLayout_ = new QGridLayout;
    pScreenLayout_->setSpacing(kShareItemSpace);
    pScreenLayout_->setContentsMargins(5, 0, 8, 0);
    LINFO("LayoutScreen start, size=%d", source_screen.size());
    for (int i = 0; i < row; i++) {
        for (int j = 0; j < col; j++) {
            if ((i*col + j) < source_screen.size()) {
                ScreenShareItem* item = new ScreenShareItem(ui.scrollAreaWidget_desktop, (i == 0 && j == 0) ? true : false);
                connect(item, SIGNAL(SignalChecked(void*, bool)), this, SLOT(OnSelectChanged(void*, bool)));
                item->setFixedSize(kShareItemWidth, kShareItemHeight);
                IScreenShareManager::ScreenCaptureSourceInfo info = source_screen.at(i*col + j);
                QString file_name = QString::fromStdString(info.source_name);
                //LINFO("------Drew Screen Image:name=%s src-wid=%d,hei=%d --- wid=%d,hei=%d", file_name.toStdString().c_str(), info.thumb_bgra.width, info.thumb_bgra.height, kShareItemWidth - kShareItemMargin, kShareItemHeight - kShareItemMargin);
                QImage img((const uchar *)info.thumb_bgra.buffer, info.thumb_bgra.width, info.thumb_bgra.height, QImage::Format_ARGB32);
                item->SetInfo(info.source_id, info.type, QString::fromStdString(info.source_name), QPixmap::fromImage(img));
                pScreenLayout_->addWidget(item, i, j);
                vec_item_.push_back(item);
                if (last_selected_source_id == nullptr)
                    last_selected_source_id = info.source_id;
            }
            else {
                QWidget* pNullWgt = new QWidget(ui.scrollAreaWidget_desktop);
                pNullWgt->setFixedSize(kShareItemWidth, kShareItemHeight);
                pScreenLayout_->addWidget(pNullWgt, i, j);
                vec_null_item_.push_back(pNullWgt);
            }
        }
    }
    ui.scrollAreaWidget_desktop->setLayout(pScreenLayout_);
}
void ScreenShareWindow::LayoutWindow(const std::vector<IScreenShareManager::ScreenCaptureSourceInfo>& source_info) {
    std::vector<IScreenShareManager::ScreenCaptureSourceInfo> source_window;
    for (auto info : source_info) {
        if (info.type == IScreenShareManager::kWindow) {
            source_window.push_back(info);
        }
    }

    int col = (this->width() - kShareItemWidth) / kShareItemHeight;
    int row = source_window.size() / (col > 0 ? col : 1);
    if ((source_window.size() % col) != 0)
        row += 1;

    ui.scrollArea->setHorizontalScrollBarPolicy(Qt::ScrollBarAlwaysOff);
    ui.scrollArea->setVerticalScrollBarPolicy(Qt::ScrollBarAsNeeded);

    ui.scrollAreaWidgetContents->setFixedSize(col * kShareItemWidth + (col - 1) * kShareItemSpace, row * kShareItemHeight + (row - 1) * kShareItemSpace);
    pLayout_ = new QGridLayout;
    pLayout_->setSpacing(kShareItemSpace);
    pLayout_->setContentsMargins(5, 0, 8, 0);
    LINFO("LayoutWindow start, size=%d", source_window.size());
    IScreenShareManager::ImageBuffer image_buffer;
    for (int i = 0; i < row; i++) {
        for (int j = 0; j < col; j++) {
            if ((i*col + j) < source_window.size()) {
                ScreenShareItem* item = new ScreenShareItem(ui.scrollAreaWidgetContents);
                connect(item, SIGNAL(SignalChecked(void*, bool)), this, SLOT(OnSelectChanged(void*, bool)));
                item->setFixedSize(kShareItemWidth, kShareItemHeight);
                IScreenShareManager::ScreenCaptureSourceInfo info = source_window.at(i*col + j);
                QString file_name = QString::fromStdString(info.source_name);
                if (info.is_minimized) {
                    image_buffer = info.icon_bgra;
                } else {
                    image_buffer = info.thumb_bgra;
                }
                //LINFO("------Drew Window Image:name=%s src-wid=%d,hei=%d --- wid=%d,hei=%d", file_name.toStdString().c_str(), image_buffer.width, image_buffer.height, kShareItemWidth - kShareItemMargin, kShareItemHeight - kShareItemMargin);
                QImage img((const uchar *)image_buffer.buffer, image_buffer.width, image_buffer.height, QImage::Format_ARGB32);
                item->SetInfo(info.source_id, info.type, QString::fromStdString(info.source_name), QPixmap::fromImage(img));
                pLayout_->addWidget(item, i, j);
                vec_item_.push_back(item);
            }
            else {
                QWidget* pNullWgt = new QWidget(ui.scrollAreaWidget_desktop);
                pNullWgt->setFixedSize(kShareItemWidth, kShareItemHeight);
                pLayout_->addWidget(pNullWgt, i, j);
                vec_null_item_.push_back(pNullWgt);
            }
        }
    }
    ui.scrollAreaWidgetContents->setLayout(pLayout_);
}
void ScreenShareWindow::ClearLayoutData() {
    if (pLayout_ != nullptr) {
        delete pLayout_;
        pLayout_ = nullptr;
    }
    if (pScreenLayout_ != nullptr) {
        delete pScreenLayout_;
        pScreenLayout_ = nullptr;
    }

    std::vector<ScreenShareItem*>::iterator iter = vec_item_.begin();
    while (iter != vec_item_.end()) {
        ScreenShareItem* item = *iter;
        iter = vec_item_.erase(iter);
        delete item;
    }
    vec_item_.clear();

    std::vector<QWidget*>::iterator iter_null = vec_null_item_.begin();
    while (iter_null != vec_null_item_.end()) {
        QWidget* item = *iter_null;
        iter_null = vec_null_item_.erase(iter_null);
        delete item;
    }
    vec_null_item_.clear();
}

void ScreenShareWindow::OnOK() {
    if (this->GetSelected().size() > 0)
        emit SignalConfirmShareScreen(true);
    else
        this->OnClose();
}
void ScreenShareWindow::OnClose() {
    ClearLayoutData();
    emit SignalConfirmShareScreen(false);
}
std::vector<IScreenShareManager::ScreenCaptureSourceInfo> ScreenShareWindow::GetSelected() {
    std::vector<IScreenShareManager::ScreenCaptureSourceInfo> vec_selected;
    for (auto item : vec_item_) {
        if (item->IsChecked())
            vec_selected.push_back(item->GetInfo());
    }

    return vec_selected;
}
void ScreenShareWindow::OnSelectChanged(void* source_id, bool bChecked) {
    if (last_selected_source_id != nullptr) {
        for (auto item : vec_item_) {
            if (item->GetInfo().source_id == last_selected_source_id
                && source_id != last_selected_source_id) {
                item->UpdateStyle(false);
            }
        }
    }
    last_selected_source_id = source_id;
}

void ScreenShareWindow::mouseMoveEvent(QMouseEvent* event) {
    view_dragger_.mouseMove(event);

    QWidget::mouseMoveEvent(event);
}

void ScreenShareWindow::mousePressEvent(QMouseEvent* event) {
    view_dragger_.mousePress(event);

    QWidget::mousePressEvent(event);
}

void ScreenShareWindow::mouseReleaseEvent(QMouseEvent* event) {
    view_dragger_.mouseRelease(event);

    QWidget::mouseReleaseEvent(event);
}
void ScreenShareWindow::showEvent(QShowEvent* event) {
    LOAD_STYLE_SHEET(":/ScreenShareWindow/ScreenShareWindow.qss");

    QDesktopWidget* desktop = QApplication::desktop();
    QRect rc = desktop->availableGeometry(this->parentWidget());
    this->move(rc.x() + (rc.width() - this->width()) / 2, rc.y() + (rc.height() - this->height()) / 2);

    QWidget::showEvent(event);
}
void ScreenShareWindow::OnVideoFluencyPreferred(bool checked) {
    //设置画质参数
    TUIVideoQosPreference preference = TUIVideoQosPreference::kSmooth;
    if (!checked)
        preference = TUIVideoQosPreference::kClear;
    DataStore::Instance()->SetQosPreference(preference);
    TUIRoomCore::GetInstance()->SetVideoQosPreference(preference);
}
