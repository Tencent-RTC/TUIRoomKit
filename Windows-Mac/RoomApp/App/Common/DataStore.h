#ifndef __DATA_CENTER_H__
#define __DATA_CENTER_H__

#include <mutex>
#include "TUIRoomDef.h"
#include "Common.h"
#include "CommonDef.h"

// �����û����������س־û����ݣ�����������Ӧ�ó���
// ���豾�س־û������ڸ����н��б����ļ�д��
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

    void SetAudioQuality(liteav::TRTCAudioQuality audio_quality);
    liteav::TRTCAudioQuality GetAudioQuality();

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
    bool            share_pc_voice_ = false;    //  ��Ļ����ʱ����PCϵͳ����
    bool            is_app_launch_ = false;     //  TRTCApp����
    bool            ai_noise_reduction_opened_ = true; // �Ƿ���AI����
    bool            is_online_ = false;
    Language        current_language_ = Language::kChinese;
    liteav::TRTCAudioQuality audio_quality_ = liteav::TRTCAudioQualitySpeech;
};

#endif  //  !__DATA_CENTER_H__