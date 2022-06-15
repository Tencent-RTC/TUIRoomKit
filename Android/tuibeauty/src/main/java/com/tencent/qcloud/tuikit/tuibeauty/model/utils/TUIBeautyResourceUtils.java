package com.tencent.qcloud.tuikit.tuibeauty.model.utils;

import android.content.res.Resources;
import android.graphics.Color;

import com.tencent.qcloud.tuikit.tuibeauty.model.TUIBeautyResourceParse;

public class TUIBeautyResourceUtils {
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

    public static int getStringId(String resName) {
        return getResources().getIdentifier(resName, TYPE_STRING, TUIBeautyResourceParse.getPackageName());
    }

    public static String getString(String resName) {
        if (resName.startsWith(TYPE_QUOTE_PREFIX)) {
            return getResources().getString(getStringId(resName.substring(1)));
        }
        return resName;
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
}
