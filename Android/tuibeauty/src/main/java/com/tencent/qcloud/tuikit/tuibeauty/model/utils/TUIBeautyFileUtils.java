package com.tencent.qcloud.tuikit.tuibeauty.model.utils;

import android.content.Context;
import android.text.TextUtils;
import android.util.Log;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

public class TUIBeautyFileUtils {
    private static final String TAG = "TUIBeautyFileUtils";

    private static String sResPath;

    public static void setResPath(String path) {
        if (!path.endsWith(File.separator)) {
            path = path + File.separator;
        }
        sResPath = path;
    }

    public static String getResPath() {
        ensureResPathAlreadySet();
        return sResPath;
    }

    public static void copyRes(Context context) {
        ensureResPathAlreadySet();

        new File(sResPath, "light_assets").delete();
        new File(sResPath, "light_material").delete();
        new File(sResPath, "MotionRes").delete();

        for (String path : new String[]{"Light3DPlugin", "LightCore", "LightHandPlugin", "LightSegmentPlugin"}) {
            copyAssets(context, path, sResPath + "light_assets");
        }
    }

    private static void ensureResPathAlreadySet() {
        if (TextUtils.isEmpty(sResPath)) {
            throw new IllegalStateException("resource path not set, call setResPath() first.");
        }
    }

    public static boolean organizeAssetsDirectory(String downloadedDirectory) {
        for (String path : new String[]{"Light3DPlugin", "LightCore", "LightHandPlugin", "LightSegmentPlugin"}) {
            if (!copyAssets(downloadedDirectory, path, "light_assets")) {
                return false;
            }
            deleteRecursive(new File(downloadedDirectory + File.separator + path));
        }

        for (String path : new String[]{"lut"}) {
            if (!copyAssets(downloadedDirectory, path, "light_material" + File.separator + path)) {
                return false;
            }
            deleteRecursive(new File(downloadedDirectory + File.separator + path));
        }
        return true;
    }

    private static void deleteRecursive(File fileOrDirectory) {
        if (fileOrDirectory == null) {
            return;
        }
        if (!fileOrDirectory.exists()) {
            return;
        }
        if (fileOrDirectory.isDirectory()) {
            for (File child : fileOrDirectory.listFiles()) {
                deleteRecursive(child);
            }
        }
        fileOrDirectory.delete();
    }


    private static boolean copyAssets(Context context, String oldPath, String newPath) {
        try {
            String[] fileNames = context.getAssets().list(oldPath);
            if (fileNames.length > 0) {
                Log.e(TAG, "copyAssets path: " + Arrays.toString(fileNames));
                File file = new File(newPath);
                file.mkdirs();
                for (String fileName : fileNames) {
                    copyAssets(context, oldPath + "/" + fileName, newPath + "/" + fileName);
                }
            } else {
                InputStream is = context.getAssets().open(oldPath);
                FileOutputStream fos = new FileOutputStream(new File(newPath));
                byte[] buffer = new byte[1024 * 1024];
                int byteCount = 0;
                while ((byteCount = is.read(buffer)) != -1) {
                    fos.write(buffer, 0, byteCount);
                }
                fos.flush();
                is.close();
                fos.close();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return true;
    }

    private static boolean copyAssets(String parent, String oldPath, String newPath) {
        FileInputStream is = null;
        FileOutputStream fos = null;
        try {
            File file = new File(parent + File.separator + oldPath);
            if (!file.exists()) {
                return true;
            }
            if (file.isDirectory()) {
                String[] fileNames = file.list();
                if (fileNames == null || fileNames.length <= 0) {
                    return true;
                }
                File newFile = new File(parent + File.separator + newPath);
                newFile.mkdirs();
                for (String fileName : fileNames) {
                    copyAssets(parent, oldPath + File.separator + fileName, newPath + File.separator + fileName);
                }
            } else {
                is = new FileInputStream(file);
                fos = new FileOutputStream(new File(parent + File.separator + newPath));
                byte[] buffer = new byte[1024 * 1024];
                int byteCount = 0;
                while ((byteCount = is.read(buffer)) != -1) {
                    fos.write(buffer, 0, byteCount);
                }
                fos.flush();
                is.close();
                fos.close();
            }
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        } finally {
            if (is != null) {
                try {
                    is.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }

            if (fos != null) {
                try {
                    fos.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
