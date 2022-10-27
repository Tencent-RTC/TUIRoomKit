package com.tencent.qcloud.tuikit.tuibeauty.model.download;

import static com.tencent.qcloud.tuikit.tuibeauty.model.utils.TUIBeautyFileUtils.organizeAssetsDirectory;

import android.annotation.TargetApi;
import android.content.Context;
import android.os.Build;
import android.text.TextUtils;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.tencent.qcloud.tuikit.tuibeauty.R;
import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyResourceParse;

import java.io.File;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * 美颜模块素材下载
 */
public class TUIBeautyMaterialDownloader {

    public static final String DOWNLOAD_FILE_POSTFIX  = ".zip";
    public static final String ONLINE_MATERIAL_FOLDER = "xmagic/res";
    public static final String ONLINE_LIB_FOLDER      = "xmagic/libs";
    public static final String ONLINE_MOTION_FOLDER   = "xmagic/res/MotionRes";

    private static final int CPU_COUNT      = Runtime.getRuntime().availableProcessors();
    private static final int CORE_POOL_SIZE = CPU_COUNT + 1;

    private Context mContext;
    private boolean mProcessing;

    private String                    mURL;
    private String                    mMaterialId;
    private TUIBeautyDownloadListener mListener;
    private DownloadThreadPool        mDownloadThreadPool;

    public TUIBeautyMaterialDownloader(Context context, String materialId, String url) {
        mContext = context;
        mMaterialId = materialId;
        mURL = url;
        mProcessing = false;
    }

    public void start(@Nullable TUIBeautyDownloadListener listener, boolean isLibs, boolean isMotion) {
        if (listener == null || TextUtils.isEmpty(mURL) || mProcessing) {
            return;
        }
        mProcessing = true;
        mListener = listener;
        mListener.onDownloadProgress(0);

        File onlineMaterialDir;
        if (isLibs) {
            onlineMaterialDir = TUIBeautyResourceParse.getExternalFilesDir(mContext, ONLINE_LIB_FOLDER);
        } else if (isMotion) {
            onlineMaterialDir = TUIBeautyResourceParse.getExternalFilesDir(mContext, ONLINE_MOTION_FOLDER);
        } else {
            onlineMaterialDir = TUIBeautyResourceParse.getExternalFilesDir(mContext, ONLINE_MATERIAL_FOLDER);
        }
        if (onlineMaterialDir == null || onlineMaterialDir.getName().startsWith("null")) {
            int resId = R.string.tuibeauty_video_material_download_progress_no_enough_storage_space;
            mListener.onDownloadFail(mContext.getString(resId));
            stop();
            return;
        }
        if (!onlineMaterialDir.exists()) {
            onlineMaterialDir.mkdirs();
        }

        TUIBeautyHttpFileListener fileListener = new TUIBeautyHttpFileListener() {
            @Override
            public void onSaveSuccess(@NonNull File file) {
                //删除该素材目录下的旧文件
                File path = new File(file.toString().substring(0, file.toString().indexOf(DOWNLOAD_FILE_POSTFIX)));
                if (path.exists() && path.isDirectory()) {
                    File[] oldFiles = path.listFiles();
                    if (oldFiles != null) {
                        for (File f : oldFiles) {
                            f.delete();
                        }
                    }
                }
                String dataDir = TUIBeautyResourceParse.unZip(file.getPath(), file.getParentFile().getPath());
                if (TextUtils.isEmpty(dataDir)) {
                    int resId = R.string.tuibeauty_video_material_download_progress_material_unzip_failed;
                    mListener.onDownloadFail(mContext.getString(resId));
                    stop();
                    return;
                }
                file.delete();
                organizeAssetsDirectory(dataDir);
                mListener.onDownloadSuccess(dataDir);
                stop();
            }

            @Override
            public void onSaveFailed(File file, Exception e) {
                int resId = R.string.tuibeauty_video_material_download_progress_download_failed;
                mListener.onDownloadFail(mContext.getString(resId));
                stop();
            }

            @Override
            public void onProgressUpdate(int progress) {
                mListener.onDownloadProgress(progress);
            }

            @Override
            public void onProcessEnd() {
                mProcessing = false;
            }

        };

        ThreadPoolExecutor threadPool = getThreadExecutor();
        threadPool.execute(new TUIBeautyHttpFileHelper(mContext, mURL, onlineMaterialDir.getPath(),
                mMaterialId + DOWNLOAD_FILE_POSTFIX, fileListener, true));
    }

    public void stop() {
        mListener = null;
    }

    public synchronized ThreadPoolExecutor getThreadExecutor() {
        if (mDownloadThreadPool == null || mDownloadThreadPool.isShutdown()) {
            mDownloadThreadPool = new DownloadThreadPool(CORE_POOL_SIZE);
        }
        return mDownloadThreadPool;
    }

    public static class DownloadThreadPool extends ThreadPoolExecutor {

        @TargetApi(Build.VERSION_CODES.GINGERBREAD)
        public DownloadThreadPool(int poolSize) {
            super(poolSize, poolSize, 0L, TimeUnit.MILLISECONDS,
                    new LinkedBlockingDeque<Runnable>(),
                    Executors.defaultThreadFactory(), new DiscardOldestPolicy());
        }
    }

}
