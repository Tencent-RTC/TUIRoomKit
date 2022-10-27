package com.tencent.qcloud.tuikit.tuibeauty.model.download;

import android.content.Context;
import android.text.TextUtils;

import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyResourceParse;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class TUIBeautyHttpFileHelper implements Runnable {

    private static final int    BUFFERED_READER_SIZE = 8192;
    private static final int    TIMEOUT              = 30000;
    private static final String HTTP_PREFIX          = "http";
    private static final String HTTP_GET             = "GET";

    private Context                   mContext;
    private TUIBeautyHttpFileListener mListener;

    private String  mMaterialUrl;
    private String  mFolder;
    private String  mFilename;
    private long    mContentLength;
    private long    mDownloadingSize;
    private boolean mNeedProgress;

    public TUIBeautyHttpFileHelper(Context context, String materialUrl, String folder, String filename,
                                   TUIBeautyHttpFileListener listener, boolean needProgress) {
        mContext = context;
        mMaterialUrl = materialUrl;
        mFolder = folder;
        mFilename = filename;
        mListener = listener;
        mNeedProgress = needProgress;
    }

    @Override
    public void run() {
        if (!TUIBeautyResourceParse.isNetworkAvailable(mContext)
                || TextUtils.isEmpty(mMaterialUrl)
                || TextUtils.isEmpty(mFolder)
                || TextUtils.isEmpty(mFilename)
                || !mMaterialUrl.startsWith(HTTP_PREFIX)) {
            if (mListener != null) {
                mListener.onSaveFailed(null, new Exception("network or resource is unavailable"));
            }
            mListener = null;
            return;
        }
        File dstFolder = new File(mFolder);
        if (!dstFolder.exists()) {
            dstFolder.mkdirs();
        } else {
            if (dstFolder.isFile()) {
                dstFolder.delete();
                dstFolder.mkdirs();
            }
        }
        File dstFile = new File(mFolder + File.separator + mFilename);

        HttpURLConnection client = null;
        InputStream responseIs = null;
        FileOutputStream fos = null;
        int statusCode = -1;
        boolean success = false;
        Exception failException = null;

        try {
            if (dstFile.exists()) {
                dstFile.delete();
            }
            dstFile.createNewFile();
            client = (HttpURLConnection) new URL(mMaterialUrl).openConnection();

            // 设置网络超时参数
            client.setConnectTimeout(TIMEOUT);
            client.setReadTimeout(TIMEOUT);
            client.setDoInput(true);
            client.setRequestMethod(HTTP_GET);

            statusCode = client.getResponseCode();
            success = client.getResponseCode() == HttpURLConnection.HTTP_OK;

            if (success) {
                if (mNeedProgress) {
                    mContentLength = client.getContentLength();
                }
                responseIs = client.getInputStream();


                fos = new FileOutputStream(dstFile);
                mDownloadingSize = 0;
                mListener.onProgressUpdate(0);
                int length = -1;
                byte[] buffer = new byte[BUFFERED_READER_SIZE];
                while ((length = responseIs.read(buffer)) != -1) {
                    fos.write(buffer, 0, length);
                    if (mNeedProgress) {
                        int pre = (int) (mDownloadingSize * 100 / mContentLength);
                        mDownloadingSize += length;
                        int now = (int) (mDownloadingSize * 100 / mContentLength);
                        if (pre != now && mListener != null) {
                            mListener.onProgressUpdate(now);
                        }
                    }
                }
                fos.flush();
                if (mListener != null) {
                    mListener.onProgressUpdate(100);
                    mListener.onSaveSuccess(dstFile);
                }
            } else {
                failException = new Exception("http status got exception. code = " + statusCode);
            }
        } catch (Exception e) {
            failException = e;
            e.printStackTrace();
        } finally {
            try {
                if (fos != null) {
                    fos.close();
                }
                if (responseIs != null) {
                    responseIs.close();
                }
                if (client != null) {
                    client.disconnect();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
            mListener.onProcessEnd();
        }

        if (!success || null != failException) {
            mListener.onSaveFailed(dstFile, failException);
        }
    }
}
