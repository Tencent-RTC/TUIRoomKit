package com.tencent.liteav.basic;

import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.util.TypedValue;

import androidx.annotation.StringRes;

public class ResourceUtils {

    private static final String TYPE_QUOTE_PREFIX = "@";
    private static final String TYPE_COLOR_PREFIX = "#";

    private static final String TYPE_STRING   = "string";
    private static final String TYPE_COLOR    = "color";
    private static final String TYPE_DRAWABLE = "drawable";

    public static int getDrawableId(String resName) {
        if (resName.startsWith(TYPE_QUOTE_PREFIX)) {
            return getResources().getIdentifier(resName, TYPE_DRAWABLE, RTCubeUtils.getPackageName());
        }
        throw new IllegalArgumentException("\"" + resName + "\" is illegal, must start with \"@\".");
    }

    public static int getStringId(String resName) {
        return getResources().getIdentifier(resName, TYPE_STRING, RTCubeUtils.getPackageName());
    }

    public static String getString(String resName) {
        if (resName.startsWith(TYPE_QUOTE_PREFIX)) {
            return getResources().getString(getStringId(resName.substring(1)));
        }
        return resName;
    }

    public static String getString(@StringRes int resId) {
        return getResources().getString(resId);
    }

    public static int getColor(String resName) {
        if (resName.startsWith(TYPE_COLOR_PREFIX)) {
            return Color.parseColor(resName);
        }
        if (resName.startsWith(TYPE_QUOTE_PREFIX)) {
            return getResources().getColor(getColorId(resName));
        }
        throw new IllegalArgumentException("\"" + resName + "\" is unknown color.");
    }

    public static int getColorId(String resName) {
        return getResources().getIdentifier(resName, TYPE_COLOR, RTCubeUtils.getPackageName());
    }

    public static Resources getResources() {
        return RTCubeUtils.getApplicationByReflect().getResources();
    }

    public static int dip2px(float dpValue) {
        final float scale = getResources().getDisplayMetrics().density;
        return (int) (dpValue * scale + 0.5f);
    }

    public static Bitmap decodeResource(int id) {
        TypedValue value = new TypedValue();
        getResources().openRawResource(id, value);
        BitmapFactory.Options opts = new BitmapFactory.Options();
        opts.inTargetDensity = value.density;
        return BitmapFactory.decodeResource(getResources(), id, opts);
    }
}
