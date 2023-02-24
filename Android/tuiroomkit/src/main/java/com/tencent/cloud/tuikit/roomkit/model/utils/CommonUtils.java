package com.tencent.cloud.tuikit.roomkit.model.utils;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.text.TextUtils;
import android.view.View;
import android.view.animation.Animation;
import android.view.animation.TranslateAnimation;

import androidx.annotation.ColorInt;
import androidx.annotation.Nullable;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class CommonUtils {

    private static final int QR_CODE_MARGIN     = 2;
    private static final int ANIMATION_DURATION = 500;

    public static String getAppName(Context context) {
        ApplicationInfo applicationInfo = context.getApplicationInfo();
        return context.getPackageManager().getApplicationLabel(applicationInfo).toString();
    }

    public static void horizontalAnimation(View view, boolean isShowingView) {
        float fromXValue = isShowingView ? 1.0f : 0.0f;
        float toXValue = isShowingView ? 0.0f : 1.0f;
        TranslateAnimation animation = new TranslateAnimation(Animation.RELATIVE_TO_SELF, fromXValue,
                Animation.RELATIVE_TO_SELF, toXValue,
                Animation.RELATIVE_TO_SELF, 0.0f,
                Animation.RELATIVE_TO_SELF, 0.0f);
        animation.setDuration(ANIMATION_DURATION);
        view.startAnimation(animation);
    }

    @Nullable
    public static Bitmap createQRCodeBitmap(String content, int width, int height) {
        Charset charset = StandardCharsets.UTF_8;
        if (TextUtils.isEmpty(content)) {
            return null;
        }

        if (width <= 0 || height <= 0) {
            return null;
        }

        Map<EncodeHintType, Object> hints = new HashMap<>();

        if (charset != null && !TextUtils.isEmpty(charset.name())) {
            hints.put(EncodeHintType.CHARACTER_SET, charset.name());
        }
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H);
        hints.put(EncodeHintType.MARGIN, QR_CODE_MARGIN);

        try {
            BitMatrix bitMatrix = new QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, width, height, hints);

            int[] pixels = new int[width * height];
            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    pixels[y * width + x] = bitMatrix.get(x, y) ? Color.BLACK : Color.WHITE;
                }
            }

            Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
            bitmap.setPixels(pixels, 0, width, 0, 0, width, height);
            return bitmap;
        } catch (WriterException e) {
            e.printStackTrace();
        }
        return null;
    }
}
