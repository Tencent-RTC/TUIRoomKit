package com.tencent.qcloud.tuikit.tuibeauty.model.download;

/**
 * 美颜数据监听,回调给上层去处理,上层可根据状态更改自己的UI显示
 */
public interface TUIBeautyDownloadListener {
    /**
     * 下载失败
     *
     * @param errorMsg 失败原因
     */
    void onDownloadFail(String errorMsg);

    /**
     * 下载进度
     *
     * @param progress 下载进度
     */
    void onDownloadProgress(final int progress);

    /**
     * 下载成功
     *
     * @param filePath 下载路径
     */
    void onDownloadSuccess(String filePath);
}
