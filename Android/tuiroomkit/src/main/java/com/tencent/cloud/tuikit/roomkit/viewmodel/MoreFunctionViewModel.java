package com.tencent.cloud.tuikit.roomkit.viewmodel;

import static com.tencent.liteav.debug.GenerateTestUserSig.XMAGIC_LICENSE_KEY;
import static com.tencent.liteav.debug.GenerateTestUserSig.XMAGIC_LICENSE_URL;

import android.content.Context;
import android.util.Log;
import android.view.View;


import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.DialogFragment;

import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.model.manager.RoomEngineManager;
import com.tencent.qcloud.tuicore.TUIConstants;
import com.tencent.qcloud.tuicore.TUICore;
import com.tencent.trtc.TRTCCloudDef;
import com.tencent.trtc.TRTCCloudListener;

import java.util.HashMap;
import java.util.Map;

public class MoreFunctionViewModel {
    private static final String TAG = "ExtensionViewModel";

    private Context       mContext;
    private TUIRoomEngine mRoomEngine;

    public MoreFunctionViewModel(Context context) {
        mContext = context;
        mRoomEngine = RoomEngineManager.sharedInstance(mContext).getRoomEngine();
    }

    public View getBeautyView() {
        Map<String, Object> map = new HashMap<>();
        map.put(TUIConstants.TUIBeauty.PARAM_NAME_CONTEXT, mContext);
        map.put(TUIConstants.TUIBeauty.PARAM_NAME_LICENSE_URL, XMAGIC_LICENSE_URL);
        map.put(TUIConstants.TUIBeauty.PARAM_NAME_LICENSE_KEY, XMAGIC_LICENSE_KEY);
        TUICore.callService(TUIConstants.TUIBeauty.SERVICE_NAME, TUIConstants.TUIBeauty.METHOD_INIT_XMAGIC, map);

        HashMap<String, Object> beautyParaMap = new HashMap<>();
        beautyParaMap.put("context", mContext);
        beautyParaMap.put("beautyManager", mRoomEngine.getBeautyManager());
        beautyParaMap.put("icon", R.drawable.tuiroomkit_ic_beauty);
        Map<String, Object> beautyRetMap = TUICore
                .getExtensionInfo("com.tencent.qcloud.tuikit.tuibeauty.view.TUIBeautyButton",
                        beautyParaMap);
        if (beautyRetMap != null && beautyRetMap.size() > 0) {
            Object beautyVIew = beautyRetMap.get("TUIBeauty");
            if (beautyVIew instanceof View) {
                Log.i(TAG, "TUIBeauty TUIExtensionView getExtensionInfo success");
                enableBeautyProcess();
                return (View) beautyVIew;
            } else {
                Log.e(TAG, "TUIBeauty TUIExtensionView getExtensionInfo not find");
                return null;
            }
        } else {
            Log.e(TAG, "TUIBeauty getExtensionInfo null");
            return null;
        }
    }

    private void enableBeautyProcess() {
        mRoomEngine.getTRTCCloud().setLocalVideoProcessListener(TRTCCloudDef.TRTC_VIDEO_PIXEL_FORMAT_Texture_2D,
                TRTCCloudDef.TRTC_VIDEO_BUFFER_TYPE_TEXTURE, new TRTCCloudListener.TRTCVideoFrameListener() {
                    @Override
                    public void onGLContextCreated() {

                    }

                    @Override
                    public int onProcessVideoFrame(TRTCCloudDef.TRTCVideoFrame trtcVideoFrame,
                                                   TRTCCloudDef.TRTCVideoFrame trtcVideoFrame1) {
                        Map<String, Object> map = new HashMap<>();
                        map.put(TUIConstants.TUIBeauty.PARAM_NAME_SRC_TEXTURE_ID, trtcVideoFrame.texture.textureId);
                        map.put(TUIConstants.TUIBeauty.PARAM_NAME_FRAME_WIDTH, trtcVideoFrame.width);
                        map.put(TUIConstants.TUIBeauty.PARAM_NAME_FRAME_HEIGHT, trtcVideoFrame.height);
                        if (TUICore.callService(TUIConstants.TUIBeauty.SERVICE_NAME,
                                TUIConstants.TUIBeauty.METHOD_PROCESS_VIDEO_FRAME, map) != null) {
                            trtcVideoFrame1.texture.textureId = (int) TUICore
                                    .callService(TUIConstants.TUIBeauty.SERVICE_NAME,
                                            TUIConstants.TUIBeauty.METHOD_PROCESS_VIDEO_FRAME, map);
                        } else {
                            trtcVideoFrame1.texture.textureId = trtcVideoFrame.texture.textureId;
                        }
                        return 0;
                    }

                    @Override
                    public void onGLContextDestory() {
                        TUICore.callService(TUIConstants.TUIBeauty.SERVICE_NAME,
                                TUIConstants.TUIBeauty.METHOD_DESTROY_XMAGIC, null);
                    }
                });
    }

    public void showSettingView(DialogFragment dialogFragment, String tag) {
        if (dialogFragment != null) {
            if (dialogFragment.isVisible()) {
                try {
                    dialogFragment.dismissAllowingStateLoss();
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
            } else {
                if (!dialogFragment.isAdded() && mContext instanceof AppCompatActivity) {
                    dialogFragment.show(((AppCompatActivity) mContext).getSupportFragmentManager(), tag);
                }
            }

        }
    }
}
