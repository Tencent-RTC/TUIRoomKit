#include "SettingViewController.h"
#include <QTimer>
#include <QBitmap>
#include <QPainter>
#include <QFile>
#include <QProcess>
#include "TUIRoomCore.h"
#include "./MessageDispatcher/MessageDispatcher.h"
#include "Common/DataStore.h"
#include <qDebug>
#include "TXMessageBox.h"

SettingViewController::SettingViewController(QWidget *parent)
    : QWidget(parent)
    , view_dragger_(this)
{
    ui.setupUi(this);
    setWindowFlags(windowFlags() | Qt::FramelessWindowHint | Qt::Tool);

    ui.widget_video_bg->hide();
    ui.widget_bottom_operate->hide();
    
    QBitmap bmp(this->size());
    bmp.fill();
    QPainter p(&bmp);
    p.setPen(Qt::NoPen);
    p.setBrush(Qt::black);
    p.drawRoundedRect(bmp.rect(), 5, 5);
    setMask(bmp);
        
    InitUi();
    InitConnect();

    movie_ = new QMovie(":/ImageResource/Loading_Video.gif");
    movie_->setScaledSize(QSize(50, 50));
}
SettingViewController::~SettingViewController()
{
    if (item_delegate_ != nullptr) {
        delete item_delegate_;
        item_delegate_ = nullptr;
    }
}
void SettingViewController::mouseMoveEvent(QMouseEvent* event) {
    view_dragger_.mouseMove(event);
    QWidget::mouseMoveEvent(event);
}
void SettingViewController::mousePressEvent(QMouseEvent* event) {
    view_dragger_.mousePress(event);
    QWidget::mousePressEvent(event);
}
void SettingViewController::mouseReleaseEvent(QMouseEvent* event) {
    view_dragger_.mouseRelease(event);
    QWidget::mouseReleaseEvent(event);
}
void SettingViewController::showEvent(QShowEvent *event) {
    if (ui.stackedWidget->currentIndex() == 0) {
        ui.loading->setMovie(movie_);
        movie_->start();
        QTimer::singleShot(300, [=]() {
            int index = ui.comboBox_camera->currentIndex();
            CameraCurrentIndexChanged(index);
            ui.stackedWidget_camera->setCurrentIndex(1);
            movie_->stop();
        });
    }
    ui.radioButton_smooth->setChecked(true);

    this->resize(850, 550);
    this->setMaximumWidth(850);

    QBitmap bmp(this->size());
    bmp.fill();
    QPainter p(&bmp);
    p.setPen(Qt::NoPen);
    p.setBrush(Qt::black);
    p.drawRoundedRect(bmp.rect(), 5, 5);
    setMask(bmp);

    LOAD_STYLE_SHEET(":/SettingView/SettingViewController.qss");

    QWidget::showEvent(event);
}
void SettingViewController::SetCurrentPage(int index) {
    if (index < 0 || index > 3)
        return;
    switch (index) {
    case 0:
        ui.btn_VideoSetting->setChecked(true);
        break;
    case 1:
        ui.btn_BeautySetting->setChecked(true);
        break;
    case 2:
        ui.btn_AudioSetting->setChecked(true);
        break;
    case 3:
        ui.btn_StatisticsSetting->setChecked(true);
        break;
    }
}
void SettingViewController::OnTabClicked(bool checked) {
    if (checked == false)
        return;

    TUIRoomCore::GetInstance()->GetDeviceManager()->stopCameraDeviceTest();
    QObject* obj = sender();
    if (obj == ui.btn_VideoSetting) {
        ui.stackedWidget->setCurrentIndex(0);

        ui.loading->setMovie(movie_);
        movie_->start();
        QTimer::singleShot(300, [=]() {
            TUIRoomCore::GetInstance()->GetDeviceManager()->startCameraDeviceTest((liteav::TXView)ui.video_view->winId());
            ui.stackedWidget_camera->setCurrentIndex(1);
            movie_->stop();
        });
    }
    else if (obj == ui.btn_BeautySetting) {
        ui.stackedWidget->setCurrentIndex(1);

        ui.loading_beauty->setMovie(movie_);
        movie_->start();
        QTimer::singleShot(300, [=]() {
            TUIRoomCore::GetInstance()->GetDeviceManager()->startCameraDeviceTest((liteav::TXView)ui.video_view_beauty->winId());
            ui.stackedWidget_beauty->setCurrentIndex(1);
            movie_->stop();
        });
    }
    else if (obj == ui.btn_AudioSetting) {
        ui.stackedWidget->setCurrentIndex(2);
        bool is_default_close_mic = DataStore::Instance()->IsDefaultCloseMic();
        ui.ckbox_default_close_mic->setChecked(is_default_close_mic);
    }
    else if (obj == ui.btn_StatisticsSetting) {
        ui.stackedWidget->setCurrentIndex(3);
    }
}
void SettingViewController::OnClose() {
    TUIRoomCore::GetInstance()->GetDeviceManager()->stopCameraDeviceTest();
    TUIRoomCore::GetInstance()->GetDeviceManager()->stopSpeakerDeviceTest();
    TUIRoomCore::GetInstance()->GetDeviceManager()->stopMicDeviceTest();

    emit SignalClose();
}

void SettingViewController::InitUi() {
    ui.btn_testMic->setProperty("white", true);
    ui.btn_testSpeaker->setProperty("white", true);
    ui.ckbox_default_close_mic->hide();

    ui.stackedWidget->setCurrentIndex(0);

    liteav::ITRTCDeviceInfo* activeCam = TUIRoomCore::GetInstance()->GetDeviceManager()->getCurrentDevice(liteav::TRTCDeviceTypeCamera);
    //获取摄像头列表
    liteav::ITXDeviceCollection* camera_list = TUIRoomCore::GetInstance()->GetDeviceManager()->getDevicesList(liteav::TXMediaDeviceTypeCamera);
    if (camera_list == nullptr) {
        return;
    }
    int current_camera_index = 0;
    for (int i = 0; i < camera_list->getCount(); ++i) {
        ui.comboBox_camera->addItem(camera_list->getDeviceName(i));
        if (std::string(activeCam->getDevicePID()) == std::string(camera_list->getDevicePID(i))) {
            current_camera_index = i;
        }
    }
    ui.comboBox_camera->setCurrentIndex(current_camera_index);
    activeCam->release();
    camera_list->release();

    liteav::ITRTCDeviceInfo* activeMic = TUIRoomCore::GetInstance()->GetDeviceManager()->getCurrentDevice(liteav::TRTCDeviceTypeMic);
    //获取麦克风列表
    liteav::ITXDeviceCollection* mic_list = TUIRoomCore::GetInstance()->GetDeviceManager()->getDevicesList(liteav::TXMediaDeviceTypeMic);
    if (mic_list == nullptr) {
        return;
    }
    int current_mic_index = 0;
    for (int i = 0; i < mic_list->getCount(); ++i) {
        ui.comboBox_microphone->addItem(mic_list->getDeviceName(i));
        if (std::string(activeMic->getDevicePID()) == std::string(mic_list->getDevicePID(i))) {
            current_mic_index = i;
        }
    }
    ui.comboBox_microphone->setCurrentIndex(current_mic_index);
    activeMic->release();
    mic_list->release();

    liteav::ITRTCDeviceInfo* activeSpeaker = TUIRoomCore::GetInstance()->GetDeviceManager()->getCurrentDevice(liteav::TRTCDeviceTypeSpeaker);
    //获取扬声器列表
    liteav::ITXDeviceCollection* speaker_list = TUIRoomCore::GetInstance()->GetDeviceManager()->getDevicesList(liteav::TXMediaDeviceTypeSpeaker);
    if (speaker_list == nullptr) {
        return;
    }
    int current_speaker_index = 0;
    for (int i = 0; i < speaker_list->getCount(); ++i) {
        ui.comboBox_speaker->addItem(speaker_list->getDeviceName(i));
        if (std::string(activeSpeaker->getDevicePID()) == std::string(speaker_list->getDevicePID(i))) {
            current_speaker_index = i;
        }
    }
    ui.comboBox_speaker->setCurrentIndex(current_speaker_index);
    activeSpeaker->release();
    speaker_list->release();

    // 画质偏好（平滑和清晰）设置
    TUIVideoQosPreference preference = DataStore::Instance()->GetQosPreference();
    if (preference == TUIVideoQosPreference::kClear) {
        //ui.radioButton_clear->setChecked(true);
    }
    else {
        //ui.radioButton_smooth->setChecked(true);
    }

    // 镜像设置
    bool is_mirror = DataStore::Instance()->GetMirror();
    ui.ckbox_mirror->setChecked(is_mirror);
    if (is_mirror)
        TUIRoomCore::GetInstance()->SetVideoMirror(is_mirror);

    // 美颜设置
    TUIBeautyConfig beauty_config = DataStore::Instance()->GetBeautyParam();
    ui.ckbox_beauty->setChecked(beauty_config.open_beauty);
    ui.radioButton_natural->setEnabled(beauty_config.open_beauty);
    ui.radioButton_smooth->setEnabled(beauty_config.open_beauty);
    if (ui.ckbox_beauty->isChecked()) {
        ui.radioButton_natural->setChecked(beauty_config.beauty_style == liteav::TRTCBeautyStyleNature ? true : false);
        ui.radioButton_smooth->setChecked(beauty_config.beauty_style == liteav::TRTCBeautyStyleSmooth ? true : false);
    }
    ui.hSlider_Buffing->setEnabled(beauty_config.open_beauty);
    ui.hSlider_Buffing->setValue(beauty_config.beauty_value * 10);
    ui.hSlider_Buffing->setSingleStep(10);
    ui.hSlider_Buffing->setTickInterval(10);
    ui.hSlider_Whitening->setEnabled(beauty_config.open_beauty);
    ui.hSlider_Whitening->setValue(beauty_config.white_value * 10);
    ui.hSlider_Whitening->setSingleStep(10);
    ui.hSlider_Whitening->setTickInterval(10);

    // 音频设置
    bool is_default_close_mic = DataStore::Instance()->IsDefaultCloseMic();
    ui.ckbox_default_close_mic->setChecked(is_default_close_mic);

    int mic_value = TUIRoomCore::GetInstance()->GetDeviceManager()->getCurrentDeviceVolume(liteav::TRTCDeviceTypeMic);
    ui.hSlider_microphone->setValue(mic_value);
    int speaker_value = TUIRoomCore::GetInstance()->GetDeviceManager()->getCurrentDeviceVolume(liteav::TRTCDeviceTypeSpeaker);
    ui.hSlider_speaker->setValue(speaker_value);
}

void SettingViewController::InitConnect() {
    connect(ui.btn_close, &QPushButton::clicked, this, &SettingViewController::OnClose);
    connect(ui.btn_VideoSetting, &QPushButton::toggled, this, &SettingViewController::OnTabClicked);
    connect(ui.btn_BeautySetting, &QPushButton::toggled, this, &SettingViewController::OnTabClicked);
    connect(ui.btn_AudioSetting, &QPushButton::toggled, this, &SettingViewController::OnTabClicked);
    connect(ui.btn_StatisticsSetting, &QPushButton::toggled, this, &SettingViewController::OnTabClicked);

    connect(ui.btn_testMic, SIGNAL(clicked()), this, SLOT(OnTestMic()));
    connect(ui.btn_testSpeaker, SIGNAL(clicked()), this, SLOT(OnTestSpeaker()));

    connect(ui.comboBox_camera, SIGNAL(currentIndexChanged(int)), this, SLOT(CameraCurrentIndexChanged(int)));
    connect(ui.comboBox_microphone, SIGNAL(currentIndexChanged(int)), this, SLOT(MicCurrentIndexChanged(int)));
    connect(ui.comboBox_speaker, SIGNAL(currentIndexChanged(int)), this, SLOT(SpeakerCurrentIndexChanged(int)));

    if (item_delegate_ == nullptr)
        item_delegate_ = new QStyledItemDelegate(this);
    ui.comboBox_camera->setItemDelegate(item_delegate_);
    ui.comboBox_microphone->setItemDelegate(item_delegate_);
    ui.comboBox_speaker->setItemDelegate(item_delegate_);

    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnTestSpeakerVolume, this, [=](uint32_t volume) {
        ui.progressBar_speaker->setValue(volume);
    });
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnTestMicrophoneVolume, this, [=](uint32_t volume) {
        ui.progressBar_microphone->setValue(volume);
    });
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnStatistics, this, &SettingViewController::OnStatistics);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnNetworkQuality, this, &SettingViewController::OnNetQuality);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalAudioDeviceCaptureVolumeChanged, this,
        [=](uint32_t volume, bool muted) {
        if (muted)
            ui.hSlider_microphone->setValue(0);
        else
            ui.hSlider_microphone->setValue(volume);
    });
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalAudioDevicePlayoutVolumeChanged, this,
        [=](uint32_t volume, bool muted) {
        if (muted)
            ui.hSlider_speaker->setValue(0);
        else
            ui.hSlider_speaker->setValue(volume);
    });

    connect(ui.ckbox_mirror, SIGNAL(clicked(bool)), this, SLOT(OnMirrorClicked(bool)));
    connect(ui.ckbox_beauty, SIGNAL(clicked(bool)), this, SLOT(OnBeautyClicked(bool)));
    connect(ui.hSlider_Buffing, SIGNAL(valueChanged(int)), this, SLOT(OnBuffingValueChanged(int)));
    connect(ui.hSlider_Whitening, SIGNAL(valueChanged(int)), this, SLOT(OnWhiteningValueChanged(int)));
    connect(ui.radioButton_smooth, SIGNAL(clicked()), this, SLOT(OnRadioButtonChanged()));
    connect(ui.radioButton_natural, SIGNAL(clicked()), this, SLOT(OnRadioButtonChanged()));

    connect(ui.ckbox_default_close_mic, &QCheckBox::clicked, this, [](bool checked) {
        DataStore::Instance()->SetDefaultCloseMic(checked);
    });

    connect(ui.hSlider_microphone, SIGNAL(valueChanged(int)), this, SLOT(OnMicrophoneValueChanged(int)));
    connect(ui.hSlider_speaker, SIGNAL(valueChanged(int)), this, SLOT(OnSpeakerValueChanged(int)));
}
void SettingViewController::OnMirrorClicked(bool checked) {
    DataStore::Instance()->SetMirror(checked);
    TUIRoomCore::GetInstance()->SetVideoMirror(checked);
}
void SettingViewController::OnBeautyClicked(bool checked) {
    ui.ckbox_beauty->setChecked(checked);
    ui.radioButton_natural->setEnabled(checked);
    ui.radioButton_smooth->setEnabled(checked);
    ui.hSlider_Buffing->setEnabled(checked);
    ui.hSlider_Whitening->setEnabled(checked);

    TUIBeautyConfig beauty_config = DataStore::Instance()->GetBeautyParam();
    beauty_config.open_beauty = checked;
    DataStore::Instance()->SetBeautyParam(beauty_config);
        
    if (checked) {
        TUIRoomCore::GetInstance()->SetBeautyStyle(beauty_config.beauty_style, beauty_config.beauty_value, 
            beauty_config.white_value, beauty_config.ruddiness_value);
    }
    else {
        TUIRoomCore::GetInstance()->SetBeautyStyle(beauty_config.beauty_style, 0, 0, 0);
    }
}
void SettingViewController::OnBuffingValueChanged(int value) {
    TUIBeautyConfig beauty_config = DataStore::Instance()->GetBeautyParam();
    beauty_config.beauty_value = value / 10;
    DataStore::Instance()->SetBeautyParam(beauty_config);

    TUIRoomCore::GetInstance()->SetBeautyStyle(beauty_config.beauty_style, beauty_config.beauty_value,
        beauty_config.white_value, beauty_config.ruddiness_value);
}
void SettingViewController::OnWhiteningValueChanged(int value) {
    TUIBeautyConfig beauty_config = DataStore::Instance()->GetBeautyParam();
    beauty_config.white_value = value / 10;
    DataStore::Instance()->SetBeautyParam(beauty_config);

    TUIRoomCore::GetInstance()->SetBeautyStyle(beauty_config.beauty_style, beauty_config.beauty_value,
        beauty_config.white_value, beauty_config.ruddiness_value);
}
void SettingViewController::OnRadioButtonChanged() {
    QObject* obj = sender();
    TUIBeautyConfig beauty_config = DataStore::Instance()->GetBeautyParam();
    if (obj == ui.radioButton_smooth) {
        beauty_config.beauty_style = liteav::TRTCBeautyStyle::TRTCBeautyStyleSmooth;
    }
    else if (obj == ui.radioButton_natural) {
        beauty_config.beauty_style = liteav::TRTCBeautyStyle::TRTCBeautyStyleNature;
    }
    DataStore::Instance()->SetBeautyParam(beauty_config);

    TUIRoomCore::GetInstance()->SetBeautyStyle(beauty_config.beauty_style, beauty_config.beauty_value,
        beauty_config.white_value, beauty_config.ruddiness_value);
}

void SettingViewController::CameraCurrentIndexChanged(int index) {
    liteav::ITXDeviceCollection* camera_list = TUIRoomCore::GetInstance()->GetDeviceManager()->getDevicesList(liteav::TXMediaDeviceTypeCamera);
    if (camera_list == nullptr) {
        return;
    }
    if (index < camera_list->getCount()) {
        TUIRoomCore::GetInstance()->GetDeviceManager()->setCurrentDevice(liteav::TXMediaDeviceTypeCamera, camera_list->getDevicePID(index));
        TUIRoomCore::GetInstance()->GetDeviceManager()->startCameraDeviceTest((liteav::TXView)ui.video_view->winId());
    }
}

void SettingViewController::MicCurrentIndexChanged(int index) {
    int idx = ui.comboBox_microphone->currentIndex();
    liteav::ITXDeviceCollection* mic_list = TUIRoomCore::GetInstance()->GetDeviceManager()->getDevicesList(liteav::TXMediaDeviceTypeMic);
    if (mic_list == nullptr) {
        return;
    }
    if (idx < mic_list->getCount()) {
        TUIRoomCore::GetInstance()->GetDeviceManager()->setCurrentDevice(liteav::TXMediaDeviceTypeMic, mic_list->getDevicePID(idx));
    }
}
void SettingViewController::SpeakerCurrentIndexChanged(int index) {
    int idx = ui.comboBox_speaker->currentIndex();
    liteav::ITXDeviceCollection* speaker_list = TUIRoomCore::GetInstance()->GetDeviceManager()->getDevicesList(liteav::TXMediaDeviceTypeSpeaker);
    if (speaker_list == nullptr) {
        return;
    }
    if (idx < speaker_list->getCount()) {
        TUIRoomCore::GetInstance()->GetDeviceManager()->setCurrentDevice(liteav::TXMediaDeviceTypeSpeaker, speaker_list->getDevicePID(idx));
    }
}

void SettingViewController::OnTestMic() {
    if (ui.btn_testMic->isChecked()) {
        ui.btn_testMic->setText(tr("Stop"));
        int index = ui.comboBox_microphone->currentIndex();
        liteav::ITXDeviceCollection* mic_list = TUIRoomCore::GetInstance()->GetDeviceManager()->getDevicesList(liteav::TXMediaDeviceTypeMic);
        if (mic_list == nullptr) {
            return;
        }
        if (index < mic_list->getCount()) {
            TUIRoomCore::GetInstance()->GetDeviceManager()->startMicDeviceTest(200);
        }
        mic_list->release();
    }
    else {
        TUIRoomCore::GetInstance()->GetDeviceManager()->stopMicDeviceTest();
        ui.progressBar_microphone->setValue(0);
        ui.btn_testMic->setText(tr("Test"));
    }
}
void SettingViewController::OnTestSpeaker() {
    if (ui.btn_testSpeaker->isChecked()) {
        ui.btn_testSpeaker->setText(tr("Stop"));

        int index = ui.comboBox_speaker->currentIndex();
        liteav::ITXDeviceCollection* speaker_list = TUIRoomCore::GetInstance()->GetDeviceManager()->getDevicesList(liteav::TXMediaDeviceTypeSpeaker);
        if (speaker_list == nullptr) {
            return;
        }
        if (index < speaker_list->getCount()) {
            QString file_path = QCoreApplication::applicationDirPath() + "/trtcres/testspeak.mp3";
            QFile file(file_path);
            if (!file.exists()) {
                ui.btn_testSpeaker->setChecked(false);
                ui.btn_testSpeaker->setText(tr("Test"));
                TXMessageBox::Instance().AddLineTextMessage(tr("Not find test file in trtcres directory!"));
            }
            else {
                int ret = TUIRoomCore::GetInstance()->GetDeviceManager()->startSpeakerDeviceTest(file_path.toStdString().c_str());
            }
        }
        speaker_list->release();
    }
    else {
        TUIRoomCore::GetInstance()->GetDeviceManager()->stopSpeakerDeviceTest();
        ui.progressBar_speaker->setValue(0);
        ui.btn_testSpeaker->setText(tr("Test"));
    }
}
void SettingViewController::OnMicrophoneValueChanged(int value) {
    TUIRoomCore::GetInstance()->GetDeviceManager()->setCurrentDeviceVolume(liteav::TRTCDeviceTypeMic, value);
}
void SettingViewController::OnSpeakerValueChanged(int value) {
    TUIRoomCore::GetInstance()->GetDeviceManager()->setCurrentDeviceVolume(liteav::TRTCDeviceTypeSpeaker, value);
}

void SettingViewController::OnStatistics(const liteav::TRTCStatistics& statis) {
    // 当前系统 CPU占用率
    QString system_cpu_info = QString("%1%").arg(statis.systemCpu);
    ui.lb_cpu->setText(system_cpu_info);

    // 当前App CPU占用率
    QString app_cpu_info = QString("%1%").arg(statis.appCpu);
    ui.lb_cpu_app->setText(app_cpu_info);

    // 其他App CPU占用率
    QString other_cpu_info = QString("%1%").arg(statis.systemCpu - statis.appCpu);
    ui.lb_cpu_other->setText(other_cpu_info);

    // 网络延时
    QString rtt = QString(tr("delay %1ms")).arg(statis.rtt);
    ui.lb_network->setText(rtt);

    // 上行丢包率
    QString upLoss = QString(tr(" %1%")).arg(statis.upLoss);
    ui.lb_upLoss->setText(upLoss);

    // 下行丢包率
    QString downLoss = QString(tr(" %1%")).arg(statis.downLoss);
    ui.lb_downLoss->setText(downLoss);

    // 上行数据为本地视频帧和音频帧数据和
    int send_bitrate = 0;
    for (int i = 0; i < statis.localStatisticsArraySize; ++i) {
        send_bitrate += (statis.localStatisticsArray[i].audioBitrate + statis.localStatisticsArray[i].videoBitrate);
    }
    QString bandWidthUp = QString(tr(" %1Kbps")).arg(send_bitrate);
    ui.lb_band_width_up->setText(bandWidthUp);

    // 下行数据为所有远端用户视频帧和音频帧数据和
    int receive_bitrate = 0;
    for (int i = 0; i < statis.remoteStatisticsArraySize; ++i) {
        receive_bitrate += (statis.remoteStatisticsArray[i].audioBitrate + statis.remoteStatisticsArray[i].videoBitrate);
    }
    QString bandWidthDown = QString(tr(" %1Kbps")).arg(receive_bitrate);
    ui.lb_band_width_down->setText(bandWidthDown);

    //qDebug() << QString("sentBytes : %1, receivedBytes : %2 ").arg(send_bitrate).arg(receive_bitrate);
    QString str_video_frame_rate = " 0FPS";
    QString str_audio_bitrate = " 0Kbps";
    QString str_share_screen_frame_rate = " 0FPS";
    int count = statis.localStatisticsArraySize;
    for (int i = 0; i < count; ++i) {
        if (statis.localStatisticsArray[i].streamType == liteav::TRTCVideoStreamTypeBig) {
            int frame_rate = statis.localStatisticsArray[i].frameRate;
            str_video_frame_rate = QString(tr(" %1FPS")).arg(frame_rate);
            int audio_bitrate = statis.localStatisticsArray[i].audioBitrate;
            str_audio_bitrate = QString(tr(" %1Kbps")).arg(audio_bitrate);
        }
        else if (statis.localStatisticsArray[i].streamType == liteav::TRTCVideoStreamTypeSub) {
            // 屏幕分享
            int frame_rate = statis.localStatisticsArray[i].frameRate;
            str_share_screen_frame_rate = QString(tr(" %1FPS")).arg(frame_rate);
        } 
    }
    ui.lb_local_video_frame_rate->setText(str_video_frame_rate);
    ui.lb_audio_bitrate->setText(str_audio_bitrate);
    ui.lb_local_share_screen_frame_rate->setText(str_share_screen_frame_rate);

    GetAppMemoryUsage();
    GetTotalMemory();
}
void SettingViewController::OnNetQuality(UserNetQualityInfo local_user_quality, std::vector<UserNetQualityInfo> remote_users_quality) {
    QString net_quality = tr("Unknow");
    if (std::string(local_user_quality.user_id).empty()) {
        switch (local_user_quality.quality) {
        case liteav::TRTCQuality_Unknown:///未定义
            net_quality = tr("Unknow");
            break;
        case liteav::TRTCQuality_Excellent:///当前网络非常好
            net_quality = tr("Excellent");
            break;
        case liteav::TRTCQuality_Good:///当前网络比较好
            net_quality = tr("Good");
            break;
        case liteav::TRTCQuality_Poor:///当前网络一般
            net_quality = tr("Poor");
            break;
        case liteav::TRTCQuality_Bad:///当前网络较差
            net_quality = tr("Bad");
            break;
        case liteav::TRTCQuality_Vbad:///当前网络很差
            net_quality = tr("Very bad");
            break;
        case liteav::TRTCQuality_Down:///当前网络不满足 TRTC 的最低要求
            net_quality = tr("Down");
            break;
        }
    }

    ui.lb_net_status->setText(net_quality);
}
#ifdef _WIN32
#include <Psapi.h>
int SettingViewController::GetAppMemoryUsage() {
    HANDLE handle = ::GetCurrentProcess();
    PROCESS_MEMORY_COUNTERS_EX pmc = { 0 };
    pmc.cb = sizeof(pmc);
    if (!GetProcessMemoryInfo(handle, (PROCESS_MEMORY_COUNTERS*)&pmc, sizeof(pmc))) {
        DWORD errCode = GetLastError();
        return 0;
    }
    ui.lb_memory_app->setText(QString::number(pmc.WorkingSetSize / (1024*1024))+" M");
    return pmc.WorkingSetSize;
}
void SettingViewController::GetTotalMemory() {
    MEMORYSTATUSEX memory_status;
    ZeroMemory(&memory_status, sizeof(MEMORYSTATUSEX));
    memory_status.dwLength = sizeof(MEMORYSTATUSEX);
    if (GlobalMemoryStatusEx(&memory_status)) {
        long total_memory_MB = memory_status.ullTotalPhys / (1024 * 1024);
        long total_memory_GB = total_memory_MB / 1024;
        ui.lb_memory_total->setText(QString::number(total_memory_GB + 1) + " G");
        //return total_memory_GB;
    }
    else {
        printf("Unknown RAM");
    }
}
#else   // Mac OS X
int SettingViewController::GetAppMemoryUsage() {
    ui.lb_memory_app->setText(tr("Unknow"));
    return 0;
}
void SettingViewController::GetTotalMemory() {
    QProcess p;
    p.start("sysctl -n hw.memsize");
    p.waitForFinished();
    QString memory_total = p.readAllStandardOutput();
    int total = memory_total.toLong() / (1024*1024*1024);
    ui.lb_memory_total->setText(QString::number(total) + " G");
    p.close();
}
#endif
