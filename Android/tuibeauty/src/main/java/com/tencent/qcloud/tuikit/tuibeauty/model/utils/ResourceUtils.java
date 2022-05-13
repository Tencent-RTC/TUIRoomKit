package com.tencent.qcloud.tuikit.tuibeauty.model.utils;

import android.content.Context;
import android.content.res.Resources;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.util.TypedValue;

import androidx.annotation.StringRes;

import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyResourceParse;

import java.io.FileInputStream;
import java.io.IOException;

public class ResourceUtils {
    private static final String TYPE_QUOTE_PREFIX = "@";
    private static final String TYPE_COLOR_PREFIX = "#";

    private static final String TYPE_STRING   = "string";
    private static final String TYPE_COLOR    = "color";
    private static final String TYPE_DRAWABLE = "drawable";

    public static int getDrawableId(String resName) {
        if (resName.startsWith(TYPE_QUOTE_PREFIX)) {
            return getResources().getIdentifier(resName, TYPE_DRAWABLE, TUIBeautyResourceParse.getPackageName());
        }
        throw new IllegalArgumentException("\"" + resName + "\" is illegal, must start with \"@\".");
    }

    private static int dp2px(Context context, int dp) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp,
                context.getResources().getDisplayMetrics());
    }

    public static Drawable getImage(Context context, String thumbPath) {
        int iconSize = dp2px(context, 50);
        Drawable drawable = new ColorDrawable(Color.argb(32, 0, 0, 0));
        Drawable thumbImg = null;
        FileInputStream is = null;
        try {
            is = new FileInputStream(thumbPath);
            thumbImg = Drawable.createFromStream(is, null);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (is != null) {
                try {
                    is.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
        if (thumbImg != null) {
            drawable = thumbImg;
        }
        drawable.setBounds(0, 0, iconSize, iconSize);
        return drawable;
    }

    public static int getStringId(String resName) {
        return getResources().getIdentifier(resName, TYPE_STRING, TUIBeautyResourceParse.getPackageName());
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
        return getResources().getIdentifier(resName, TYPE_COLOR, TUIBeautyResourceParse.getPackageName());
    }

    public static Resources getResources() {
        return TUIBeautyResourceParse.getApplication().getResources();
    }

    public static Drawable getLinearDrawable(int color) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setShape(GradientDrawable.RECTANGLE);
        drawable.setCornerRadii(new float[]{
                TUIBeautyResourceParse.dip2px(TUIBeautyResourceParse.getApplication(), 10), TUIBeautyResourceParse.dip2px(TUIBeautyResourceParse.getApplication(), 10),
                TUIBeautyResourceParse.dip2px(TUIBeautyResourceParse.getApplication(), 10), TUIBeautyResourceParse.dip2px(TUIBeautyResourceParse.getApplication(), 10),
                0, 0, 0, 0});
        return drawable;
    }
}
