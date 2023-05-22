#ifndef __DATA_CENTER_H__
#define __DATA_CENTER_H__

#include <mutex>
#include "TUIRoomDef.h"
#include "Common.h"
#include "CommonDef.h"

// 该类用户保存界面相关持久化数据（生命周期随应用程序）
// This class is used to store persistent data of UI (the lifecycle follows the application)
// 如需本地持久化，可在该类中进行本地文件写入
// To persistently store the local data, you can write to local files in this class
class DataStore final
{
public:
    static DataStore* Instance();
    static void DestoryInstance();

    void SetQosPreference(TUIVideoQosPreference preference);
    TUIVideoQosPreference GetQosPreference();

    void SetMirror(bool is_mirror);
    bool GetMirror();

    void SetBeautyParam(const TUIBeautyConfig& config);
    TUIBeautyConfig GetBeautyParam();

    void SetDefaultCloseCamera(bool is_close_camera);
    bool IsDefaultCloseCamera();
    void SetDefaultCloseMic(bool is_close_mic);
    bool IsDefaultCloseMic();

    void SetShareScreenVoice(bool share_pc_voice);
    bool IsShareScreenVoice();

    void SetUserLoginInfo(const UserLoginInfo& info);
    void SaveUserLoginInfo();
    UserLoginInfo GetRecentUserInfo();
    const UserLoginInfo& GetCurrentUserInfo();

    void SetCurrentLanguage(Language language);
    Language GetCurrentLanguage();

    bool IsAppLaunch() const;
    void ParseStartParam(int argc, char** argv);

    void SetAudioQuality(tuikit::TUIAudioQuality audio_quality);
    tuikit::TUIAudioQuality GetAudioQuality();

    void OpenAINoiseReduction(bool open);
    bool GetAINoiseReduction();

    bool IsOnlineVersion();

    std::vector<std::string> GetScreenShareUsers();
    void AddScreenShareUser(const std::string& user_id);
    void RemoveScreenShareUser(const std::string& user_id);

    void SetCurrentMainWindowUser(const std::string& user_id);
    std::string GetCurrentMainWindowUser();
private:
    DataStore();
    ~DataStore();

    void ParseLaunchParam(QStringList params);

    static DataStore* instance_;
    static std::mutex mutex_;

    TUIVideoQosPreference qos_preference_ = TUIVideoQosPreference::kSmooth;
    TUIBeautyConfig  beauty_config_;
    UserLoginInfo   user_login_info_;
    std::vector<std::string> screen_share_user_;
    std::string current_main_window_user_ = "";
    bool            is_mirror_ = false;
    bool            is_default_close_mic_ = false;
    bool            is_default_close_camera_ = false;
    bool            share_pc_voice_ = false;
    bool            is_app_launch_ = false;
    bool            ai_noise_reduction_opened_ = true;
    bool            is_online_ = false;
    Language        current_language_ = Language::kChinese;
    tuikit::TUIAudioQuality audio_quality_ = tuikit::TUIAudioQuality::kAudioQualitySpeech;
};

#endif  //  !__DATA_CENTER_H__