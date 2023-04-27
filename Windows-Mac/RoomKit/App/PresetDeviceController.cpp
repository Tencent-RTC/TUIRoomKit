#include "PresetDeviceController.h"
#include <QBitmap>
#include <QPainter>
#include "CommonDef.h"
#include "TUIRoomCore.h"
#include "MessageDispatcher/MessageDispatcher.h"
#include "DataStore.h"
#include "TXMessageBox.h"

PresetDeviceController::PresetDeviceController(QWidget* parent)
    : QWidget(parent) {
    ui.setupUi(this);
    setWindowFlags(windowFlags() | Qt::FramelessWindowHint | Qt::Tool);

    movie_ = new QMovie(":/ImageResource/Loading_Video.gif");
    movie_->setScaledSize(QSize(50, 50));
    ui.loading->setMovie(movie_);
    movie_->start();

#ifndef _WIN32
    ui.widget_audioQuality->hide();
#endif // !_WIN32

    ui.label_9->hide();
    ui.progressBar_microphone->hide();
    ui.label_10->hide();
    ui.progressBar_speaker->hide();

    InitConnect();
}

PresetDeviceController::~PresetDeviceController() {
    DELETE_OBJECT(item_delegate_);
}

void PresetDeviceController::MoveEvent(QMouseEvent* event) {
    this->move(this->parentWidget()->x() + (this->parentWidget()->width() - this->width()) / 2, this->parentWidget()->y() + (this->parentWidget()->height() - this->height()) / 2);
}

void PresetDeviceController::showEvent(QShowEvent* event) {
    QBitmap bmp(this->size());
    bmp.fill();
    QPainter p(&bmp);
    p.setPen(Qt::NoPen);
    p.setBrush(Qt::black);
    p.drawRoundedRect(bmp.rect(), 5, 5);
    setMask(bmp);

    LOAD_STYLE_SHEET(":/SettingView/PresetDeviceController.qss");

    QWidget::showEvent(event);
}

void PresetDeviceController::OnCloseWnd() {
    TUIRoomCore::GetInstance()->StartCameraDeviceTest(false);
    TUIRoomCore::GetInstance()->GetDeviceManager()->stopSpeakerDeviceTest();
    TUIRoomCore::GetInstance()->GetDeviceManager()->stopMicDeviceTest();

    ui.btn_start->setEnabled(true);
    this->close();
}

void PresetDeviceController::InitUi() {
    ui.loading->show();
    ui.btn_testMic->setProperty("white", true);
    ui.btn_testSpeaker->setProperty("white", true);
    ui.btn_start->setProperty("blue", true);
    ui.btn_testMic->setStyle(QApplication::style());
    ui.btn_testSpeaker->setStyle(QApplication::style());
    ui.btn_start->setStyle(QApplication::style());

    liteav::ITRTCDeviceInfo* activeCam = TUIRoomCore::GetInstance()->GetDeviceManager()->getCurrentDevice(liteav::TRTCDeviceTypeCamera);
    liteav::ITXDeviceCollection* camera_list = TUIRoomCore::GetInstance()->GetDeviceManager()->getDevicesList(liteav::TXMediaDeviceTypeCamera);
    if (camera_list == nullptr) {
        return;
    }
    int current_camera_index = 0;
    QStringList camera_names;
    for (int i = 0; i < camera_list->getCount(); ++i) {
        camera_names.push_back(camera_list->getDeviceName(i));
        if (std::string(activeCam->getDevicePID()) == std::string(camera_list->getDevicePID(i))) {
            current_camera_index = i;
        }
    }
    ui.comboBox_camera->addItems(camera_names);
    ui.comboBox_camera->setCurrentIndex(current_camera_index);
    activeCam->release();
    camera_list->release();

    liteav::ITRTCDeviceInfo* activeMic = TUIRoomCore::GetInstance()->GetDeviceManager()->getCurrentDevice(liteav::TRTCDeviceTypeMic);
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

    bool is_default_close_camera = DataStore::Instance()->IsDefaultCloseCamera();
    ui.ckbox_default_close_camera->setChecked(is_default_close_camera);
    bool is_default_close_mic = DataStore::Instance()->IsDefaultCloseMic();
    ui.ckbox_default_close_mic->setChecked(is_default_close_mic);

    bool is_mirror = DataStore::Instance()->GetMirror();
    ui.ckbox_mirror->setChecked(is_mirror);
    TUIRoomCore::GetInstance()->SetVideoMirror(is_mirror);

    int mic_value = TUIRoomCore::GetInstance()->GetDeviceManager()->getCurrentDeviceVolume(liteav::TRTCDeviceTypeMic);
    ui.slider_microphone->setValue(mic_value);
    int speaker_value = TUIRoomCore::GetInstance()->GetDeviceManager()->getCurrentDeviceVolume(liteav::TRTCDeviceTypeSpeaker);
    ui.slider_speaker->setValue(speaker_value);

    if (item_delegate_ == nullptr)
        item_delegate_ = new QStyledItemDelegate();
    ui.comboBox_camera->setItemDelegate(item_delegate_);
    ui.comboBox_microphone->setItemDelegate(item_delegate_);
    ui.comboBox_speaker->setItemDelegate(item_delegate_);
    ui.comboBox_audio_quality->setItemDelegate(item_delegate_);

    TUIBeautyConfig beauty_config = DataStore::Instance()->GetBeautyParam();
    ui.ckbox_beauty->setChecked(beauty_config.open_beauty);
    ui.radioButton_natural->setEnabled(beauty_config.open_beauty);
    ui.radioButton_smooth->setEnabled(beauty_config.open_beauty);

    ui.radioButton_natural->setChecked(beauty_config.beauty_style == liteav::TRTCBeautyStyleNature ? true : false);
    ui.radioButton_smooth->setChecked(beauty_config.beauty_style == liteav::TRTCBeautyStyleSmooth ? true : false);

    ui.hSlider_Buffing->setEnabled(beauty_config.open_beauty);
    ui.hSlider_Buffing->setValue(beauty_config.beauty_value * 10);
    ui.hSlider_Buffing->setSingleStep(10);
    ui.hSlider_Buffing->setTickInterval(10);
    ui.hSlider_Whitening->setEnabled(beauty_config.open_beauty);
    ui.hSlider_Whitening->setValue(beauty_config.white_value * 10);
    ui.hSlider_Whitening->setSingleStep(10);
    ui.hSlider_Whitening->setTickInterval(10);
    OnBeautyClicked(beauty_config.open_beauty);

    tuikit::TUIAudioQuality audio_quality = DataStore::Instance()->GetAudioQuality();
    if (audio_quality == tuikit::TUIAudioQuality::kAudioProfileSpeech) {
        ui.comboBox_audio_quality->setCurrentIndex(0);
    } else if (audio_quality == tuikit::TUIAudioQuality::kAudioProfileDefault) {
        ui.comboBox_audio_quality->setCurrentIndex(1);
    } else if (audio_quality == tuikit::TUIAudioQuality::kAudioProfileMusic) {
        ui.comboBox_audio_quality->setCurrentIndex(2);
    } else {
        ui.comboBox_audio_quality->setCurrentIndex(0);
    }
    bool open_ai_noise_reduction = DataStore::Instance()->GetAINoiseReduction();
    ui.checkBox_noise_reduction->setChecked(open_ai_noise_reduction);
    if (open_ai_noise_reduction) {
        TUIRoomCore::GetInstance()->OpenAINoiseReduction();
    }
}
void PresetDeviceController::InitConnect() {
    connect(ui.btn_testMic, SIGNAL(clicked()), this, SLOT(OnTestMic()));
    connect(ui.btn_testSpeaker, SIGNAL(clicked()), this, SLOT(OnTestSpeaker()));

    connect(ui.comboBox_camera, SIGNAL(currentIndexChanged(int)), this, SLOT(CameraCurrentIndexChanged(int)));
    connect(ui.comboBox_microphone, SIGNAL(currentIndexChanged(int)), this, SLOT(MicCurrentIndexChanged(int)));
    connect(ui.comboBox_speaker, SIGNAL(currentIndexChanged(int)), this, SLOT(SpeakerCurrentIndexChanged(int)));

    connect(ui.ckbox_mirror, SIGNAL(clicked(bool)), this, SLOT(OnMirrorClicked(bool)));
    connect(ui.slider_microphone, SIGNAL(valueChanged(int)), this, SLOT(OnMicrophoneValueChanged(int)));
    connect(ui.slider_speaker, SIGNAL(valueChanged(int)), this, SLOT(OnSpeakerValueChanged(int)));

    connect(ui.ckbox_beauty, SIGNAL(clicked(bool)), this, SLOT(OnBeautyClicked(bool)));
    connect(ui.hSlider_Buffing, SIGNAL(valueChanged(int)), this, SLOT(OnBuffingValueChanged(int)));
    connect(ui.hSlider_Whitening, SIGNAL(valueChanged(int)), this, SLOT(OnWhiteningValueChanged(int)));
    connect(ui.radioButton_smooth, SIGNAL(clicked()), this, SLOT(OnRadioButtonChanged()));
    connect(ui.radioButton_natural, SIGNAL(clicked()), this, SLOT(OnRadioButtonChanged()));

    connect(ui.ckbox_default_close_mic, &QCheckBox::clicked, this, [=](bool checked) {
        DataStore::Instance()->SetDefaultCloseMic(checked);
        });
    connect(ui.ckbox_default_close_camera, &QCheckBox::clicked, this, [=](bool checked) {
        DataStore::Instance()->SetDefaultCloseCamera(checked);
        });

    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnTestSpeakerVolume, this, [=](uint32_t volume) {
        ui.progressBar_speaker->setValue(volume);
        });
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnTestMicrophoneVolume, this, [=](uint32_t volume) {
        ui.progressBar_microphone->setValue(volume);
        });
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalAudioDeviceCaptureVolumeChanged, this,
        [=](uint32_t volume, bool muted) {
            if (muted)
                ui.slider_microphone->setValue(0);
            else
                ui.slider_microphone->setValue(volume);
        });
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalAudioDevicePlayoutVolumeChanged, this,
        [=](uint32_t volume, bool muted) {
            if (muted)
                ui.slider_speaker->setValue(0);
            else
                ui.slider_speaker->setValue(volume);
        });
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnFirstVideoFrame, this,
        [=](const QString& user_id, const TUIStreamType streamType) {
            if (user_id.toStdString() == DataStore::Instance()->GetCurrentUserInfo().user_id
                && streamType == TUIStreamType::kStreamTypeCamera) {
                movie_->stop();
                ui.loading->hide();
            }
        });

    connect(ui.btn_start, &QPushButton::clicked, this, [=]() {
        emit SignalEndDetection();
        ui.btn_start->setText(tr("Entering..."));
        ui.btn_start->setEnabled(false);
        });

    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalDeviceChanged, this, [=](const QString& deviceId, liteav::TXMediaDeviceType type, \
        liteav::TXMediaDeviceState state) {
            ResetDeviceList(deviceId, type, state);
        });

    connect(ui.comboBox_audio_quality, SIGNAL(currentIndexChanged(int)), this, SLOT(OnAudioQualityIndexChanged(int)));
    connect(ui.checkBox_noise_reduction, SIGNAL(clicked(bool)), this, SLOT(OnAINoiseReductionChecked(bool)));
}
void PresetDeviceController::ResetDeviceList(const QString& deviceId, liteav::TXMediaDeviceType type, liteav::TXMediaDeviceState state) {
    if (state == TXMediaDeviceStateAdd || state == TXMediaDeviceStateRemove) {
        ui.comboBox_camera->clear();
        ui.comboBox_microphone->clear();
        ui.comboBox_speaker->clear();

        liteav::ITRTCDeviceInfo* activeCam = TUIRoomCore::GetInstance()->GetDeviceManager()->getCurrentDevice(liteav::TRTCDeviceTypeCamera);
        //获取摄像头列表
        liteav::ITXDeviceCollection* camera_list = TUIRoomCore::GetInstance()->GetDeviceManager()->getDevicesList(liteav::TXMediaDeviceTypeCamera);
        if (camera_list == nullptr) {
            return;
        }
        int current_camera_index = 0;
        QStringList camera_names;
        for (int i = 0; i < camera_list->getCount(); ++i) {
            camera_names.push_back(camera_list->getDeviceName(i));
            if (std::string(activeCam->getDevicePID()) == std::string(camera_list->getDevicePID(i))) {
                current_camera_index = i;
            }
        }
        ui.comboBox_camera->addItems(camera_names);
        ui.comboBox_camera->setCurrentIndex(current_camera_index);
        activeCam->release();
        camera_list->release();

        liteav::ITRTCDeviceInfo* activeMic = TUIRoomCore::GetInstance()->GetDeviceManager()->getCurrentDevice(liteav::TRTCDeviceTypeMic);
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
    }
}
void PresetDeviceController::ResetStart() {
    ui.btn_start->setText(tr("EnterRoom"));
    ui.btn_start->setEnabled(true);
}
void PresetDeviceController::OnMirrorClicked(bool checked) {
    DataStore::Instance()->SetMirror(checked);
    TUIRoomCore::GetInstance()->SetVideoMirror(checked);
}
void PresetDeviceController::OnMicrophoneValueChanged(int value) {
    TUIRoomCore::GetInstance()->GetDeviceManager()->setCurrentDeviceVolume(liteav::TRTCDeviceTypeMic, value);
}
void PresetDeviceController::OnSpeakerValueChanged(int value) {
    TUIRoomCore::GetInstance()->GetDeviceManager()->setCurrentDeviceVolume(liteav::TRTCDeviceTypeSpeaker, value);
}
void PresetDeviceController::CameraCurrentIndexChanged(int index) {
    liteav::ITXDeviceCollection* camera_list = TUIRoomCore::GetInstance()->GetDeviceManager()->getDevicesList(liteav::TXMediaDeviceTypeCamera);
    if (camera_list == nullptr) {
        return;
    }
    if (index < camera_list->getCount()) {
        TUIRoomCore::GetInstance()->GetDeviceManager()->setCurrentDevice(liteav::TXMediaDeviceTypeCamera, camera_list->getDevicePID(index));
        TUIRoomCore::GetInstance()->StartCameraDeviceTest(true, (TXView)ui.widget_video_view->winId());
    }
    camera_list->release();
}

void PresetDeviceController::MicCurrentIndexChanged(int index) {
    liteav::ITXDeviceCollection* mic_list = TUIRoomCore::GetInstance()->GetDeviceManager()->getDevicesList(liteav::TXMediaDeviceTypeMic);
    if (mic_list == nullptr) {
        return;
    }
    if (index < mic_list->getCount()) {
        TUIRoomCore::GetInstance()->GetDeviceManager()->setCurrentDevice(liteav::TXMediaDeviceTypeMic, mic_list->getDevicePID(index));
    }
    mic_list->release();
}
void PresetDeviceController::SpeakerCurrentIndexChanged(int index) {
    liteav::ITXDeviceCollection* speaker_list = TUIRoomCore::GetInstance()->GetDeviceManager()->getDevicesList(liteav::TXMediaDeviceTypeSpeaker);
    if (speaker_list == nullptr) {
        return;
    }
    if (index < speaker_list->getCount()) {
        TUIRoomCore::GetInstance()->GetDeviceManager()->setCurrentDevice(liteav::TXMediaDeviceTypeSpeaker, speaker_list->getDevicePID(index));
    }
    speaker_list->release();
}

void PresetDeviceController::OnTestMic() {
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
    } else {
        TUIRoomCore::GetInstance()->GetDeviceManager()->stopMicDeviceTest();
        ui.btn_testMic->setText(tr("Test"));
        ui.progressBar_microphone->setValue(0);
    }
}
void PresetDeviceController::OnTestSpeaker() {
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
            } else {
                int ret = TUIRoomCore::GetInstance()->GetDeviceManager()->startSpeakerDeviceTest(file_path.toStdString().c_str());
            }
        }
        speaker_list->release();
    } else {
        TUIRoomCore::GetInstance()->GetDeviceManager()->stopSpeakerDeviceTest();
        ui.btn_testSpeaker->setText(tr("Test"));
        ui.progressBar_speaker->setValue(0);
    }
}
void PresetDeviceController::OnBeautyClicked(bool checked) {
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
    } else {
        TUIRoomCore::GetInstance()->SetBeautyStyle(beauty_config.beauty_style, 0, 0, 0);
    }
}
void PresetDeviceController::OnBuffingValueChanged(int value) {
    TUIBeautyConfig beauty_config = DataStore::Instance()->GetBeautyParam();
    beauty_config.beauty_value = value / 10;
    DataStore::Instance()->SetBeautyParam(beauty_config);

    TUIRoomCore::GetInstance()->SetBeautyStyle(beauty_config.beauty_style, beauty_config.beauty_value,
        beauty_config.white_value, beauty_config.ruddiness_value);
}
void PresetDeviceController::OnWhiteningValueChanged(int value) {
    TUIBeautyConfig beauty_config = DataStore::Instance()->GetBeautyParam();
    beauty_config.white_value = value / 10;
    DataStore::Instance()->SetBeautyParam(beauty_config);

    TUIRoomCore::GetInstance()->SetBeautyStyle(beauty_config.beauty_style, beauty_config.beauty_value,
        beauty_config.white_value, beauty_config.ruddiness_value);
}
void PresetDeviceController::OnRadioButtonChanged() {
    QObject* obj = sender();
    TUIBeautyConfig beauty_config = DataStore::Instance()->GetBeautyParam();
    if (obj == ui.radioButton_smooth) {
        beauty_config.beauty_style = liteav::TRTCBeautyStyle::TRTCBeautyStyleSmooth;
    } else if (obj == ui.radioButton_natural) {
        beauty_config.beauty_style = liteav::TRTCBeautyStyle::TRTCBeautyStyleNature;
    }
    DataStore::Instance()->SetBeautyParam(beauty_config);

    TUIRoomCore::GetInstance()->SetBeautyStyle(beauty_config.beauty_style, beauty_config.beauty_value,
        beauty_config.white_value, beauty_config.ruddiness_value);
}

void PresetDeviceController::OnAudioQualityIndexChanged(int index) {
    tuikit::TUIAudioQuality audio_quality;
    switch (index)
    {
    case 0:
        audio_quality = tuikit::TUIAudioQuality::kAudioProfileSpeech;
        break;
    case 1:
        audio_quality = tuikit::TUIAudioQuality::kAudioProfileDefault;
        break;
    case 2:
        audio_quality = tuikit::TUIAudioQuality::kAudioProfileMusic;
        break;
    default:
        audio_quality = tuikit::TUIAudioQuality::kAudioProfileDefault;
        break;
    }
    DataStore::Instance()->SetAudioQuality(audio_quality);
}

void PresetDeviceController::OnAINoiseReductionChecked(bool checked) {
    if (checked) {
        TUIRoomCore::GetInstance()->OpenAINoiseReduction();
    } else {
        TUIRoomCore::GetInstance()->CloseAINoiseReduction();
    }
    DataStore::Instance()->OpenAINoiseReduction(checked);
}