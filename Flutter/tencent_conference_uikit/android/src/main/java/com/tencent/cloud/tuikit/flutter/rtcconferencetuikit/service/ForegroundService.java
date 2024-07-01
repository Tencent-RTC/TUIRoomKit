package com.tencent.cloud.tuikit.flutter.rtcconferencetuikit.service;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.text.TextUtils;
import android.util.Log;

import androidx.core.app.NotificationCompat;

public class ForegroundService extends Service {
    private static final String TAG         = "KeepAliveService";
    private static final String TITLE       = "title";
    private static final String DESCRIPTION = "description";

    private static final int NOTIFICATION_ID = 1001;

    public static void startForegroundService(Context context) {
        Intent intent = new Intent(context, ForegroundService.class);
        intent.putExtra(TITLE, "rtc_conference_tuikit");
        intent.putExtra(DESCRIPTION, "rtc_conference_tuikit running");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    public static void stopForegroundService(Context context) {
        Log.d(TAG, "stop keep alive service");
        Intent intent = new Intent(context, ForegroundService.class);
        context.stopService(intent);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            return START_NOT_STICKY;
        }
        String title = intent.getStringExtra(TITLE);
        String description = intent.getStringExtra(DESCRIPTION);
        if (TextUtils.isEmpty(title) || TextUtils.isEmpty(description)) {
            Log.e(TAG, "on start command wrong params");
            return START_NOT_STICKY;
        }
        Notification notification = createForegroundNotification(title, description);
        startForeground(NOTIFICATION_ID, notification);
        return START_NOT_STICKY;
    }

    private Notification createForegroundNotification(String title, String description) {
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        String notificationChannelId = "notification_channel_id_01";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            String channelName = "RTC Room Foreground Service";
            int importance = NotificationManager.IMPORTANCE_LOW;
            NotificationChannel notificationChannel =
                    new NotificationChannel(notificationChannelId, channelName, importance);
            notificationChannel.setDescription("Channel description");
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(notificationChannel);
            }
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, notificationChannelId);
        builder.setSmallIcon(android.R.mipmap.sym_def_app_icon);
        builder.setContentTitle(title);
        builder.setContentText(description);
        builder.setWhen(System.currentTimeMillis());
        return builder.build();
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
}
