package com.tencent.liteav.basic;

import android.content.ContentValues;
import android.content.Context;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.OutputStream;

public class PictureUtils {
    private static final String TAG = "PictureUtils";

    /**
     * 保存 Bitmap 到图库
     * @param context
     * @param bitmap
     * @return
     */
    public static boolean saveBitmap2Gallery(Context context, Bitmap bitmap) {
        if (context == null || bitmap == null) {
            return false;
        }
        if (Build.VERSION.SDK_INT >= 29) {
            //返回出一个URI
            Uri insert = context.getContentResolver()
                    .insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, new ContentValues());
            if (insert == null) {
                return false;
            }

            //这个打开了输出流  直接保存图片就好了
            OutputStream outputStream = null;
            try {
                outputStream = context.getContentResolver().openOutputStream(insert);
                if (outputStream == null) {
                    return false;
                } else {
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 100, outputStream);
                }
            } catch (FileNotFoundException e) {
                e.printStackTrace();
            } finally {
                try {
                    if (outputStream != null) {
                        outputStream.close();
                    }
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        } else {
            MediaStore.Images.Media.insertImage(context.getContentResolver(), bitmap, "snapshot", "desc");
        }
        return true;
    }
}
