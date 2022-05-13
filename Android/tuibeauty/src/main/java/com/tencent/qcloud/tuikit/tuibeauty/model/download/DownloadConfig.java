package com.tencent.qcloud.tuikit.tuibeauty.model.download;

import com.tencent.qcloud.tuikit.tuibeauty.model.TUIMotionModel;

import java.util.ArrayList;
import java.util.List;

public class DownloadConfig {
    public static final String DOWNLOAD_URL_LIBS_V8A = "https://liteav.sdk.qcloud.com/app/res/xmagic/libs/arm64-v8a.zip";
    public static final String DOWNLOAD_URL_LIBS_V7A = "https://liteav.sdk.qcloud.com/app/res/xmagic/libs/armeabi-v7a.zip";

    public static final String DOWNLOAD_URL_ASSETS = "https://liteav.sdk.qcloud.com/app/res/xmagic/resource/assets.zip";

    //TODO
    private static final String MOTION_RES_DOWNLOAD_PREFIX = "https://liteav.sdk.qcloud.com/app/res/xmagic/resource/";

    //Motion动效的一个压缩包是一个动效，下载时逐个下载
    //压缩时把一个动效文件夹压缩成zip即可
    public static List<TUIMotionModel> getMotionList(){
        List<TUIMotionModel> motionList = new ArrayList<>();
        motionList.addAll(addModelList("2dMotionRes",MotionRes2D));
        motionList.addAll(addModelList("3dMotionRes",MotionRes3D));
        motionList.addAll(addModelList("handMotionRes",MotionResHand));
        motionList.addAll(addModelList("makeupRes",MotionResMakeup));
        motionList.addAll(addModelList("segmentMotionRes",MotionResSegment));
        motionList.addAll(addModelList("ganMotionRes",MotionResGan));
        return motionList;
    }

    private static List<TUIMotionModel> addModelList(String category, String[] motionList) {
        List<TUIMotionModel> list = new ArrayList<>();
        for (int i = 0; i < motionList.length; i++ ){
            list.add(new TUIMotionModel(category,motionList[i],MOTION_RES_DOWNLOAD_PREFIX+motionList[i]+".zip"));
        }
        return list;
    }

    private static final String[] MotionResGan = new String[]{
            "video_bubblegum"
    };

    private static final String[] MotionResSegment = new String[]{
            "video_empty_segmentation",
            "video_guaishoutuya",
            "video_bgvideo_segmentation",
            "video_segmentation_blur_45",
            "video_segmentation_blur_75"
    };

    private static final String[] MotionResMakeup = new String[]{
            "video_fenfenxia",
            "video_guajiezhuang",
            "video_hongjiuzhuang",
            "video_nvtuanzhuang",
            "video_shaishangzhuang",
            "video_shuimitao",
            "video_xiaohuazhuang",
            "video_xuejiezhuang",
            "video_zhiganzhuang"
    };

    private static final String[] MotionResHand = new String[]{
            "video_sakuragirl",
            "video_shoushiwu"
    };

    private static final String[] MotionRes3D = new String[]{
            "video_3DFace_springflower",
            "video_feitianzhuzhu",
            "video_hudiejie",
            "video_jinli",
            "video_maoxinvhai",
            "video_ningmengyayamao",
            "video_tantanfagu",
            "video_tiankulamei",
            "video_yazi",
            "video_zhixingmeigui",
            "video_tonghuagushi"
    };

    private static final String[] MotionRes2D = new String[]{
            "video_aixinyanhua",
            "video_aiyimanman",
            "video_baozilian",
            "video_biaobai",
            "video_bingjingaixin",
            "video_boom",
            "video_boys",
            "video_cherries",
            "video_chudao",
            "video_dongriliange",
            "video_egaoshuangwanzi",
            "video_fenweiqiehuan",
            "video_fugu_dv",
            "video_guifeiface",
            "video_heimaomi",
            "video_kaixueqianhou",
            "video_kangnaixin",
            "video_kawayixiaoxiong",
            "video_keaituya",
            "video_lengliebingmo",
            "video_lianliancaomei",
            "video_litihuaduo",
            "video_liuhaifadai",
            "video_mengmengxiong",
            "video_naipingmianmo",
            "video_nightgown",
            "video_otwogirl",
            "video_qipaoshui",
            "video_qiqiupaidui",
            "video_quebanzhuang",
            "video_rixishaonv",
            "video_shangtoule",
            "video_shuangmahua",
            "video_tianxinmengniiu",
            "video_tutujiang",
            "video_xiangsuyuzhou",
            "video_xiaohonghua",
            "video_xiaohongxing",
            "video_xiaohuangmao",
            "video_xingganxiaochou",
            "video_xuancainihong",
            "video_xuanmeizhuang",
            "video_yaogunyue",
            "video_zuijiuweixun"
    };
}
