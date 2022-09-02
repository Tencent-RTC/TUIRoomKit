package com.tencent.liteav.basic;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class MD5Utils {

    private static final String[] hexDigits = {"0", "1", "2", "3", "4", "5",
            "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"};

    private static MessageDigest messageDigest = null;

    static {
        try {
            messageDigest = MessageDigest.getInstance("MD5");
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
    }

    public static String getFileMD5String(File file) {
        String ret = "";
        FileInputStream in = null;
        FileChannel ch = null;
        try {
            in = new FileInputStream(file);
            ch = in.getChannel();
            ByteBuffer byteBuffer = ch.map(FileChannel.MapMode.READ_ONLY, 0,
                    file.length());
            messageDigest.update(byteBuffer);
            ret = bytesToHex(messageDigest.digest());
        } catch (IOException e) {
            e.printStackTrace();

        } finally {
            if (in != null) {
                try {
                    in.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            if (ch != null) {
                try {
                    ch.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
        return ret;
    }

    public static String getFileMD5String(String fileName) {
        return getFileMD5String(new File(fileName));
    }

    public static String getMD5String(String sourceStr) {
        return getMD5String(sourceStr.getBytes());
    }

    public static String getMD5String(byte[] bytes) {
        messageDigest.update(bytes);
        return bytesToHex(messageDigest.digest());
    }

    public static boolean checkPassword(String pwd, String md5) {
        return getMD5String(pwd).equalsIgnoreCase(md5);
    }

    public static boolean checkPassword(char[] pwd, String md5) {
        return checkPassword(new String(pwd), md5);

    }

    public static boolean checkFileMD5(File file, String md5) {
        return getFileMD5String(file).equalsIgnoreCase(md5);

    }

    public static boolean checkFileMD5(String fileName, String md5) {
        return checkFileMD5(new File(fileName), md5);

    }

    public static String bytesToHex(byte[] bytes) {
        return bytesToHex(bytes, 0, bytes.length);

    }

    public static String bytesToHex(byte[] bytes, int start, int end) {
        StringBuilder sb = new StringBuilder();
        for (int i = start; i < start + end; i++) {
            sb.append(byteToHex(bytes[i]));
        }
        return sb.toString();

    }

    public static String byteToHex(byte bt) {
        return hexDigits[(bt & 0xf0) >> 4] + "" + hexDigits[bt & 0xf];

    }

    public static String parseUrlToFileName(String urlStr)
            throws UnsupportedEncodingException, NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] results = md.digest(urlStr.getBytes(StandardCharsets.UTF_8));
        return byteArrayToHexString(results);
    }

    private static String byteArrayToHexString(byte[] b) {
        StringBuffer resultSb = new StringBuffer();
        for (int i = 0; i < b.length; i++) {
            resultSb.append(byteToHexString(b[i]));
        }
        return resultSb.toString();
    }

    private static String byteToHexString(byte b) {
        int n = b;
        if (n < 0) {
            n = 256 + n;
        }
        int d1 = n / 16;
        int d2 = n % 16;
        return hexDigits[d1] + hexDigits[d2];
    }
}
