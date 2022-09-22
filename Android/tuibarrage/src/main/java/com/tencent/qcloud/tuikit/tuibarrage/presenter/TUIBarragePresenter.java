package com.tencent.qcloud.tuikit.tuibarrage.presenter;

import android.content.Context;
import android.util.Log;

import com.tencent.qcloud.tuikit.tuibarrage.R;
import com.tencent.qcloud.tuikit.tuibarrage.model.TUIBarrageConstants;
import com.tencent.qcloud.tuikit.tuibarrage.model.TUIBarrageIMService;
import com.tencent.qcloud.tuikit.tuibarrage.model.TUIBarrageModel;
import com.tencent.qcloud.tuikit.tuibarrage.view.ITUIBarrageDisplayView;

public class TUIBarragePresenter implements ITUIBarragePresenter {
    private static final String TAG = "TUIBarragePresenter";

    protected Context                mContext;
    public    String                 mGroupId;
    private   ITUIBarrageDisplayView mDisplayView;
    private   TUIBarrageIMService    mImService;

    public TUIBarragePresenter(Context context, String groupId) {
        mContext = context;
        mGroupId = groupId;
        initIMService();
    }

    private void initIMService() {
        if (mImService == null) {
            mImService = new TUIBarrageIMService(this);
        }
        mImService.setGroupId(mGroupId);
    }

    @Override
    public void initDisplayView(ITUIBarrageDisplayView view) {
        mDisplayView = view;
    }

    @Override
    public void destroyPresenter() {
        mDisplayView = null;
        mImService.unInitImListener();
    }

    @Override
    public void sendBarrage(final TUIBarrageModel model, final TUIBarrageCallBack.BarrageSendCallBack callback) {
        if (mImService == null) {
            initIMService();
        }

        mImService.sendBarrage(model, new TUIBarrageCallBack.ActionCallback() {
            @Override
            public void onCallback(int code, String msg) {
                if (code != 0) {
                    callback.onFailed(code, msg);
                    Log.d(TAG, "sendBarrage failed errorCode = " + code + " , errorMsg = " + msg);
                    return;
                }
                //发送成功,回调给自己进行显示
                model.extInfo.put(TUIBarrageConstants.KEY_USER_NAME, mContext.getString(R.string.tuibarrage_me));
                callback.onSuccess(code, msg, model);
            }
        });
    }

    @Override
    public void receiveBarrage(TUIBarrageModel model) {
        if (model == null || model.message == null) {
            Log.d(TAG, "receiveBarrage groupId or barrage is empty");
            return;
        }
        if (mDisplayView != null) {
            mDisplayView.receiveBarrage(model);
        }
    }
}
