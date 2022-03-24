#include "DataStore.h"
#include <QSettings>
#include "UserDirectory.h"
#include "log.h"
#ifdef _WIN32
#include "usersig/win/GenerateTestUserSig.h"
#else
#include "usersig/mac/UserSigConfig.h"
#endif // Win32

const char* kAppLaunch = "app_launch";
const char* kUserId = "user_id";
const char* kUserSig = "user_sig";
const char* kSDKAppId = "sdk_app_id";
const char* kLanguageZh = "is_language_zh";

DataStore* DataStore::instance_ = nullptr;
std::mutex DataStore::mutex_;
DataStore::DataStore(){
    qos_preference_ = TUIVideoQosPreference::kSmooth;
}
DataStore::~DataStore(){
    SaveUserLoginInfo();
}
DataStore* DataStore::Instance() {
    if (instance_ == nullptr) {
        std::lock_guard<std::mutex> lock(mutex_);
        if (instance_ == nullptr) {
            instance_ = new (std::nothrow)DataStore;
        }
    }

    return instance_;
}
void DataStore::DestoryInstance() {
    if (instance_ != nullptr) {
        delete instance_;
        instance_ = nullptr;
    }
}
void DataStore::SetQosPreference(TUIVideoQosPreference preference) {
    qos_preference_ = preference;
}
TUIVideoQosPreference DataStore::GetQosPreference() {
    return qos_preference_;
}

void DataStore::SetMirror(bool is_mirror) {
    is_mirror_ = is_mirror;
}
bool DataStore::GetMirror() {
    return is_mirror_;
}

void DataStore::SetBeautyParam(const TUIBeautyConfig& config) {
    beauty_config_.beauty_style = config.beauty_style;
    beauty_config_.beauty_value = config.beauty_value;
    beauty_config_.open_beauty = config.open_beauty;
    beauty_config_.ruddiness_value = config.ruddiness_value;
    beauty_config_.white_value = config.white_value;

}
TUIBeautyConfig DataStore::GetBeautyParam() {
    return beauty_config_;
}

void DataStore::SetDefaultCloseCamera(bool is_close_camera) {
    is_default_close_camera_ = is_close_camera;
}
bool DataStore::IsDefaultCloseCamera() {
    return is_default_close_camera_;
}

void DataStore::SetDefaultCloseMic(bool is_close_mic) {
    is_default_close_mic_ = is_close_mic;
}
bool DataStore::IsDefaultCloseMic() {
    return is_default_close_mic_;
}

void DataStore::SetShareScreenVoice(bool share_pc_voice) {
    share_pc_voice_ = share_pc_voice;
}
bool DataStore::IsShareScreenVoice() {
    return share_pc_voice_;
}

void DataStore::SetUserLoginInfo(const UserLoginInfo& info) {
    user_login_info_ = info;
}

void DataStore::SaveUserLoginInfo() {
    QString config_file = QString::fromStdString(UserDirectory::GetUserConfigFile(is_app_launch_));
    QSettings setting(config_file, QSettings::IniFormat);
    setting.setValue("name", user_login_info_.name.c_str());
    setting.setValue("Language/language", static_cast<int>(current_language_));
    setting.sync();
}

UserLoginInfo DataStore::GetRecentUserInfo() {
    QString config_file = QString::fromStdString(UserDirectory::GetUserConfigFile(is_app_launch_));
    UserLoginInfo info;
    QSettings setting(config_file, QSettings::IniFormat);
    info.name = setting.value("name").toString().toStdString();
    int language = setting.value("Language/language").toString().toInt();
    current_language_ = Language(language);
    return info;
}

const UserLoginInfo& DataStore::GetCurrentUserInfo() {
    return user_login_info_;
}

void DataStore::SetCurrentLanguage(Language language) {
    current_language_ = language;
}
Language DataStore::GetCurrentLanguage() {
    return current_language_;
}

bool DataStore::IsAppLaunch() const{
    return is_app_launch_;
}

/*
APP启动参数协议：
AppLaunch:true
sdk_app_id:123456
user_id:test1
user_sig:user_sig
is_language_zh:true
*/
void DataStore::ParseStartParam(int argc, char** argv) {
    if (argc == 6) {
        std::string app_launch = argv[1];
        std::string sdk_app_id = argv[2];
        std::string user_id = argv[3];
        std::string user_sig = argv[4];
        std::string is_language_zh = argv[5];
        QStringList params;
        params.push_back(QString::fromStdString(app_launch));
        params.push_back(QString::fromStdString(sdk_app_id));
        params.push_back(QString::fromStdString(user_id));
        params.push_back(QString::fromStdString(user_sig));
        params.push_back(QString::fromStdString(is_language_zh));
        ParseLaunchParam(params);
    } else {
        user_login_info_ = GetRecentUserInfo();
#ifdef _WIN32
        user_login_info_.sdk_app_id = GenerateTestUserSig::instance().SDKAPPID;
#else
        user_login_info_.sdk_app_id = UserSigConfig::instance().GetSDKAPPID();
#endif // _WIN32
    }
}

void DataStore::ParseLaunchParam(QStringList params) {
    bool is_app_launch;
    bool is_language_zh;
    int sdk_app_id;
    std::string user_id;
    std::string user_sig;
    for (auto item : params) {
        LINFO("param item : %s",item.toStdString().c_str());
        auto string_list = item.split(':');
        if (string_list.size() == 2) {
            if (string_list[0] == kAppLaunch) {
                is_app_launch = true;
            } else if (string_list[0] == kUserId) {
                user_id = string_list[1].toStdString();
            } else if (string_list[0] == kUserSig) {
                user_sig = string_list[1].toStdString();
            } else if (string_list[0] == kSDKAppId) {
                sdk_app_id = string_list[1].toInt();
            } else if (string_list[0] == kLanguageZh) {
                is_language_zh = string_list[1].toInt();
            }
        }
    }

    LINFO("is_app_launch: %d, app_sdk_id: %d, user_id: %s, user_sig: %s, is_language: %d",
        is_app_launch, sdk_app_id, user_id.c_str(), user_sig.c_str(), is_language_zh);
    is_app_launch_ = is_app_launch;
    user_login_info_.user_id = user_id;
    user_login_info_.user_sig = user_sig;
    user_login_info_.sdk_app_id = sdk_app_id;

	auto recent_user_info = GetRecentUserInfo();
    user_login_info_.name = recent_user_info.name;

    current_language_ = is_language_zh ? Language::kChinese : Language::kEnglish;
}

void DataStore::SetAudioQuality(liteav::TRTCAudioQuality audio_quality) {
    audio_quality_ = audio_quality;
}

liteav::TRTCAudioQuality DataStore::GetAudioQuality() {
    return audio_quality_;
}

void DataStore::OpenAINoiseReduction(bool open) {
    ai_noise_reduction_opened_ = open;
}

bool DataStore::GetAINoiseReduction() {
    return ai_noise_reduction_opened_;
}

std::vector<std::string> DataStore::GetScreenShareUsers() {
    return screen_share_user_;
}

void DataStore::AddScreenShareUser(const std::string& user_id) {
    auto user = find(screen_share_user_.begin(), screen_share_user_.end(), user_id);
    if (user == screen_share_user_.end()) {
        screen_share_user_.push_back(user_id);
    }
}

void DataStore::RemoveScreenShareUser(const std::string& user_id) {
    auto user = find(screen_share_user_.begin(), screen_share_user_.end(), user_id);
    if (user != screen_share_user_.end()) {
        screen_share_user_.erase(user);
    }
}

void DataStore::SetCurrentMainWindowUser(const std::string& user_id) {
    current_main_window_user_ = user_id;
}

std::string DataStore::GetCurrentMainWindowUser() {
    return current_main_window_user_;
}