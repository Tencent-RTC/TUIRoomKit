// Copyright (c) 2021 Tencent. All rights reserved.
#ifndef MODULE_SCREENSHAREMANAGER_H_
#define MODULE_SCREENSHAREMANAGER_H_

#include "include/IScreenShareManager.h"
#include "ITRTCCloud.h"

using namespace liteav;

class ScreenShareManager :
    public IScreenShareManager {
 public:
     explicit ScreenShareManager(liteav::ITRTCCloud* trtc_cloud);
    virtual ~ScreenShareManager();

    /**
    * @desc ������Ļ����
    *
    * @param rendView ����Ԥ������Ŀؼ�����������Ϊnullptr����ʾ����ʾ��Ļ�����Ԥ��Ч��
    */
    virtual void StartScreenCapture(void* view);

    /**
    * @desc ֹͣ��Ļ����
    */
    virtual void StopScreenCapture();

    /**
    * @desc ��ͣ��Ļ����
    */
    virtual void PauseScreenCapture();

    /**
    * @desc �ָ���Ļ����
    */
    virtual void ResumeScreenCapture();

    /**
    * @desc ö�ٿɷ������Ļ���ڣ�������StartScreenCapture()֮ǰ����
    *
    * @param thumbSize ָ��Ҫ��ȡ�Ĵ�������ͼ��С������ͼ�����ڻ����ڴ���ѡ�������
    * @param iconSize  ָ��Ҫ��ȡ�Ĵ���ͼ���С
    * @return �����б�������Ļ
    */
#ifdef _WIN32
    virtual std::vector<ScreenCaptureSourceInfo>& GetScreenCaptureSources(const SIZE& thumb_size,
        const SIZE& icon_size);
#else
    virtual std::vector<ScreenCaptureSourceInfo>& GetScreenCaptureSources(const liteav::SIZE& thumb_size,
        const liteav::SIZE& icon_size);
#endif
    /**
    * @desc �ͷŴ����б���Դ
    */
    virtual void ReleaseScreenCaptureSources();

    /**
    * @desc ������Ļ����������÷�������Ļ���������Ҳ���Ե���
    *
    * @param source                 ָ������Դ
    * @param captureRect            ָ�����������
    */
    virtual void SelectScreenCaptureTarget(const ScreenCaptureSourceInfo& source, const RECT& capture_rect, const ScreenCaptureProperty& property);

    /**
    * @desc ������Ļ����Ļ���������С
    *
    * @param volume ���õĻ���������С����Χ0-100
    */
    //  virtual void SetSubStreamMixVolume(uint32_t volume);

    /**
    * @desc ��ָ�����ڼ�����Ļ������ų��б��У������ų��б��еĴ��ڲ��ᱻ�����ȥ
    *
    * @param window ��ϣ�������ȥ�Ĵ���
    */
    virtual void AddExcludedShareWindow(void* window);

    /**
    * @desc ��ָ�����ڴ���Ļ������ų��б����Ƴ�
    *
    * @param window ��ϣ�������ȥ�Ĵ���
    */
    virtual void RemoveExcludedShareWindow(void* window);

    /**
    * @desc �����д��ڴ���Ļ������ų��б����Ƴ�
    */
    virtual void RemoveAllExcludedShareWindow();

    /**
    * @desc ��ָ�����ڼ�����Ļ����İ����б��У���������б��еĴ�������ڲɼ����������ڻᱻ�����ȥ
    *
    * @param window ϣ���������ȥ�Ĵ���
    */
    virtual void AddIncludedShareWindow(void* window);

    /**
    * @desc ��ָ�����ڴ���Ļ����İ����б����Ƴ�
    *
    * @param window ϣ���������ȥ�Ĵ���
    */
    virtual void RemoveIncludedShareWindow(void* window);

    /**
    * @desc �����д��ڴ���Ļ����İ����б����Ƴ�
    */
    virtual void RemoveAllIncludedShareWindow();

 private:
    ITRTCCloud* trtc_cloud_;
    ITRTCScreenCaptureSourceList* source_window_list_ = nullptr;
    std::vector<IScreenShareManager::ScreenCaptureSourceInfo> screen_window_info_list_;
};
#endif  //  MODULE_SCREENSHAREMANAGER_H_
