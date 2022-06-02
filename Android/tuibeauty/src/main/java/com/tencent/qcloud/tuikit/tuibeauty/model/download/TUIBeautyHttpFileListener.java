package com.tencent.qcloud.tuikit.tuibeauty.model.download;

import java.io.File;

/**
 * 美颜数据网络下载监听
 */
public interface TUIBeautyHttpFileListener {
    /**
     * 网络下载进度
     *
     * @param progress
     */
    void onProgressUpdate(int progress);

    /**
     * 下载成功回调
     *
     * @param file 成功文件
     */
    void onSaveSuccess(File file);

    /**
     * 下载失败回调
     *
     * @param file 失败文件
     * @param e
     */
    void onSaveFailed(File file, Exception e);

    /*
    下载完成
     */
    void onProcessEnd();
}
