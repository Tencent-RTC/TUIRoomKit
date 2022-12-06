package com.tencent.qcloud.tuikit.tuibeauty.core;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.util.Log;

import com.tencent.qcloud.tuicore.TUIConstants;
import com.tencent.qcloud.tuicore.TUICore;

/**
 * 美颜组件通过ContentProvider的方式注册到TUICore中(TUICore是各组件连接及通信的核心类);
 * 注册后,TUICore通过TUIBeautyExtension,可以获取美颜组件的布局,使用美颜功能等。
 */
public final class TUIBeautyProvider extends ContentProvider {
    private static final String TAG = "TUIBeautyProvider";

    @Override
    public boolean onCreate() {
        Log.d(TAG, "TUIBeautyProvider onCreate");
        TUIBeautyExtension extension = new TUIBeautyExtension();
        TUICore.registerExtension(TUIBeautyExtension.OBJECT_TUI_BEAUTY_BUTTON, extension);
        TUICore.registerService(TUIConstants.TUIBeauty.SERVICE_NAME, extension);
        return false;
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        return null;
    }


    @Override
    public String getType(Uri uri) {
        return null;
    }


    @Override
    public Uri insert(Uri uri, ContentValues values) {
        return null;
    }

    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) {
        return 0;
    }

    @Override
    public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) {
        return 0;
    }
}
