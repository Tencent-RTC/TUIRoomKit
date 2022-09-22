package com.tencent.qcloud.tuikit.tuibarrage.core;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.util.Log;

import com.tencent.qcloud.tuicore.TUICore;

/**
 * 弹幕组件通过ContentProvider的方式注册到TUICore中(TUICore是各组件连接及通信的核心类);
 * 注册后,TUICore通过TUIBarrageExtension,可以获取弹幕组件的布局,使用发送和接收弹幕功能。
 */
public final class TUIBarrageProvider extends ContentProvider {
    private static final String TAG = "TUIBarrageProvider";

    @Override
    public boolean onCreate() {
        Log.d(TAG, "TUIBarrageProvider onCreate");
        TUICore.registerExtension(TUIBarrageExtension.OBJECT_TUI_BARRAGE, new TUIBarrageExtension());
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
