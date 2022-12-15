package com.tencent.cloud.tuikit.roomkit.model.util;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.res.Resources;
import android.text.TextUtils;

import androidx.annotation.IntDef;

import com.tencent.qcloud.tuicore.util.PermissionRequester;
import com.tencent.cloud.tuikit.roomkit.R;

public class PermissionHelper {
    public static final int PERMISSION_MICROPHONE = 1;
    public static final int PERMISSION_CAMERA     = 2;

    @IntDef({PERMISSION_MICROPHONE, PERMISSION_CAMERA})
    public @interface PermissionType {
    }

    public static void requestPermission(Context context, @PermissionType int type, final PermissionCallback callback) {
        String permission = null;
        String reason = null;
        String reasonTitle = null;
        String deniedAlert = null;
        ApplicationInfo applicationInfo = context.getApplicationInfo();
        String appName = context.getPackageManager().getApplicationLabel(applicationInfo).toString();
        switch (type) {
            case PERMISSION_MICROPHONE: {
                permission = PermissionRequester.PermissionConstants.MICROPHONE;
                reasonTitle = context.getString(R.string.tuiroomkit_permission_mic_reason_title, appName);
                reason = context.getString(R.string.tuiroomkit_permission_mic_reason);
                deniedAlert = context.getString(R.string.tuiroomkit_tips_start_audio);
                break;
            }
            case PERMISSION_CAMERA: {
                permission = PermissionRequester.PermissionConstants.CAMERA;
                reasonTitle = context.getString(R.string.tuiroomkit_permission_camera_reason_title, appName);
                reason = context.getString(R.string.tuiroomkit_permission_camera_reason);
                deniedAlert = context.getString(R.string.tuiroomkit_tips_start_camera);
                break;
            }
            default:
                break;
        }

        PermissionRequester.SimpleCallback simpleCallback = new PermissionRequester.SimpleCallback() {
            @Override
            public void onGranted() {
                if (callback != null) {
                    callback.onGranted();
                }
            }

            @Override
            public void onDenied() {
                if (callback != null) {
                    callback.onDenied();
                }
            }
        };
        if (!TextUtils.isEmpty(permission)) {
            PermissionRequester.permission(permission)
                    .reason(reason)
                    .reasonTitle(reasonTitle)
                    .deniedAlert(deniedAlert)
                    .callback(simpleCallback)
                    .permissionDialogCallback(new PermissionRequester.PermissionDialogCallback() {
                        @Override
                        public void onApproved() {
                            if (callback != null) {
                                callback.onDialogApproved();
                            }
                        }

                        @Override
                        public void onRefused() {
                            if (callback != null) {
                                callback.onDialogRefused();
                            }
                        }
                    })
                    .request();
        }
    }

    public interface PermissionCallback {
        void onGranted();

        void onDenied();

        void onDialogApproved();

        void onDialogRefused();
    }
}