// Copyright (c) 2021 Tencent. All rights reserved.
#ifndef MODULE_SCREENSHAREMANAGER_H_
#define MODULE_SCREENSHAREMANAGER_H_

#include "include/IScreenShareManager.h"
#include "ITUIRoomEngine.h"
#include "ITRTCCloud.h"

#include "TUIRoomCoreCallback.h"
#include "TUIRoomDef.h"

class ScreenShareManager :
    public IScreenShareManager {
 public:
     ScreenShareManager(tuikit::TUIRoomEngine* room_engine, TUIRoomCoreCallback* callback);
    virtual ~ScreenShareManager();

    /**
     * @desc ������Ļ����
     *
     * @param rendView ����Ԥ������Ŀؼ�����������Ϊnullptr����ʾ����ʾ��Ļ�����Ԥ��Ч��
     */

    /**
     * @desc Start screen sharing
     *
     * @param rendView The control sustaining the preview image, which can be set to nullptr, indicating not to display the preview of the shared screen
     */
    virtual void StartScreenCapture(void* target_id, void* view);

    /**
     * @desc ֹͣ��Ļ����
     */

    /**
     * @desc Stop screen sharing
     */
    virtual void StopScreenCapture();

    /**
     * @desc ��ͣ��Ļ����
     */

    /**
     * @desc Pause screen sharing
     */
    virtual void PauseScreenCapture();

    /**
     * @desc �ָ���Ļ����
     */

    /**
     * @desc Resume screen sharing
     */
    virtual void ResumeScreenCapture();

    /**
     * @desc ö�ٿɷ������Ļ���ڣ�������StartScreenCapture()֮ǰ����
     *
     * @param thumbSize ָ��Ҫ��ȡ�Ĵ�������ͼ��С������ͼ�����ڻ����ڴ���ѡ�������
     * @param iconSize  ָ��Ҫ��ȡ�Ĵ���ͼ���С
     * @return �����б�������Ļ
     */

    /**
     * @desc Enumerate shareable windows. We recommend you call this API before calling `StartScreenCapture()`
     *
     * @param thumbSize Specify the thumbnail size of the window to be obtained. The thumbnail can be drawn on the window selection UI
     * @param iconSize The icon size.
     * @return List of windows (including the screen)
     */
    virtual void GetScreenCaptureSources(
        const SIZE& thumb_size, const SIZE& icon_size,
        GetScreenSharingSourceCallback callback);
    /**
     * @desc �ͷŴ����б���Դ
     */

    /**
     * @desc Release window list resources
     */
    virtual void ReleaseScreenCaptureSources();

    /**
     * @desc ������Ļ����������÷�������Ļ���������Ҳ���Ե���
     *
     * @param source                 ָ������Դ
     * @param captureRect            ָ�����������
     */

    /**
     * @desc Set screen sharing parameters. This method can be called during screen sharing.
     *
     * @param source                 The source to share
     * @param captureRect            The area to capture
     */
    virtual void SelectScreenCaptureTarget(const ScreenCaptureSourceInfo& source, const RECT& capture_rect, const ScreenCaptureProperty& property);

    /**
     * @desc ������Ļ����Ļ���������С
     *
     * @param volume ���õĻ���������С����Χ0-100
     */

    /**
     * @desc Set audio mixing volume level of screen sharing
     *
     * @param volume Set audio mixing volume level. Value range: 0�C100
     */
    virtual void SetSubStreamMixVolume(uint32_t volume);

    /**
     * @desc ��ָ�����ڼ�����Ļ������ų��б��У������ų��б��еĴ��ڲ��ᱻ�����ȥ
     *
     * @param window ��ϣ�������ȥ�Ĵ���
     */

    /**
     * @desc Add a specified window to the exclusion list of screen sharing. Windows in the list will not be shared
     *
     * @param window Window not to be shared
     */
    virtual void AddExcludedShareWindow(void* window);

    /**
     * @desc ��ָ�����ڴ���Ļ������ų��б����Ƴ�
     *
     * @param window ��ϣ�������ȥ�Ĵ���
     */

    /**
     * @desc Remove a specified window from the exclusion list of screen sharing
     *
     * @param window Window not to be shared
     */
    virtual void RemoveExcludedShareWindow(void* window);

    /**
     * @desc �����д��ڴ���Ļ������ų��б����Ƴ�
     */

    /**
     * @desc Remove all windows from the exclusion list of screen sharing
     */
    virtual void RemoveAllExcludedShareWindow();

    /**
     * @desc ��ָ�����ڼ�����Ļ����İ����б��У���������б��еĴ�������ڲɼ����������ڻᱻ�����ȥ
     *
     * @param window ϣ���������ȥ�Ĵ���
     */

    /**
     * @desc Add a specified window to the inclusion list of screen sharing. Windows in the list will be shared if within the captured window area
     *
     * @param window Window to be shared
     */
    virtual void AddIncludedShareWindow(void* window);

    /**
     * @desc ��ָ�����ڴ���Ļ����İ����б����Ƴ�
     *
     * @param window ϣ���������ȥ�Ĵ���
     */

    /**
     * @desc Remove a specified window from the inclusion list of screen sharing
     *
     * @param window Window to be shared
     */
    virtual void RemoveIncludedShareWindow(void* window);

    /**
     * @desc �����д��ڴ���Ļ����İ����б����Ƴ�
     */

    /**
     * @desc Remove all windows from the inclusion list of screen sharing
     */
    virtual void RemoveAllIncludedShareWindow();

 private:
    liteav::ITRTCCloud* trtc_cloud_ = nullptr;
    tuikit::TUIRoomEngine* room_engine_ = nullptr;
    TUIRoomCoreCallback*   room_core_callback_;
    liteav::ITRTCScreenCaptureSourceList* source_window_list_ = nullptr;
    std::vector<IScreenShareManager::ScreenCaptureSourceInfo> screen_window_info_list_;
};
#endif  //  MODULE_SCREENSHAREMANAGER_H_
