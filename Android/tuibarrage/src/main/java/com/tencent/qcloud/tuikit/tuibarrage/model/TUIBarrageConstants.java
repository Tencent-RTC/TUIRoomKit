package com.tencent.qcloud.tuikit.tuibarrage.model;

import com.tencent.qcloud.tuikit.tuibarrage.R;

public class TUIBarrageConstants {
    public static final String KEY_USER_ID     = "userId";
    public static final String KEY_USER_NAME   = "userName";
    public static final String KEY_USER_AVATAR = "userAvatar";

    //消息的颜色
    public static final int[] MESSAGE_USERNAME_COLOR = {
            R.color.tuibarrage_color_msg_1,
            R.color.tuibarrage_color_msg_2,
            R.color.tuibarrage_color_msg_3,
            R.color.tuibarrage_color_msg_4,
            R.color.tuibarrage_color_msg_5,
            R.color.tuibarrage_color_msg_6,
            R.color.tuibarrage_color_msg_7,
    };

    //IM消息,KEY值设置见 TUIBarrageJson
    public static final String KEY_VERSION     = "version";
    public static final String KEY_BUSINESS_ID = "businessID";
    public static final String KEY_DATA        = "data";

    public static final String VALUE_VERSION     = "1.0";        //版本号
    public static final String VALUE_BUSINESS_ID = "TUIBarrage"; //弹幕场景
    public static final String VALUE_PLATFORM    = "Android";    //当前平台
}
