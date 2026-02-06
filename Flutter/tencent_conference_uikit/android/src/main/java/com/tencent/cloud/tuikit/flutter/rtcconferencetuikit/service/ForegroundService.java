package com.tencent.cloud.tuikit.flutter.rtcconferencetuikit.service;

import android.Manifest;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.tencent.qcloud.tuicore.util.TUIBuild;
import com.trtc.tuikit.common.foregroundservice.AudioForegroundService;
import com.trtc.tuikit.common.foregroundservice.MediaForegroundService;
import com.trtc.tuikit.common.system.ContextProvider;

/**
 * App are kept alive to ensure that process are not killed by the system in the background.
 * You can delete them if they are not needed.
 */
public class KeepAliveService extends Service {
    private static final String TAG         = "KeepAliveService";

    public static void startForegroundService(Context context) {
        String appName = context.getApplicationInfo().loadLabel(context.getPackageManager()).toString();
        String notificationText = "";
        if (hasRecordAudioPermission()) {
            Log.i(TAG, "startForegroundService audio");
            AudioForegroundService.start(context, appName, notificationText, 0);
        } else {
            Log.i(TAG, "startForegroundService media");
            MediaForegroundService.start(context, appName, notificationText, 0);
        }
    }

    public static void stopForegroundService(Context context) {
        if (hasRecordAudioPermission()) {
            Log.i(TAG, "stopForegroundService audio");
            AudioForegroundService.stop(context);
        } else {
            Log.i(TAG, "stopForegroundService media");
            MediaForegroundService.stop(context);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        throw new UnsupportedOperationException("Not yet implemented");
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        stopSelf();
    }

    private static boolean hasRecordAudioPermission() {
        if (TUIBuild.getVersionInt() < Build.VERSION_CODES.M) {
            return true;
        }
        return ContextCompat.checkSelfPermission(ContextProvider.getApplicationContext(), Manifest.permission.RECORD_AUDIO)
                == PackageManager.PERMISSION_GRANTED;
    }
}
