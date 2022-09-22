package com.tencent.qcloud.tuikit.tuibarrage.view;

import android.content.Context;
import android.util.AttributeSet;
import android.view.LayoutInflater;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.FrameLayout;

import com.tencent.qcloud.tuikit.tuibarrage.R;

/**
 * 弹幕展开按钮
 */
public class TUIBarrageButton extends FrameLayout {
    private static final String TAG = "TUIBarrageButton";

    private Context            mContext;
    private String             mGroupId;         //用户组ID(房间ID)
    private TUIBarrageSendView mBarrageSendView; //弹幕发送组件,配合输入法弹出框输入弹幕内容,并发送

    public TUIBarrageButton(Context context) {
        super(context);
    }

    public TUIBarrageButton(Context context, AttributeSet attrs, int defStyleAttr) {
        this(context, attrs, defStyleAttr, 0);
    }

    public TUIBarrageButton(Context context, AttributeSet attrs, int defStyleAttr, int defStyleRes) {
        super(context, attrs, defStyleAttr, defStyleRes);
    }

    public TUIBarrageButton(Context context, String groupId) {
        this(context);
        this.mContext = context;
        this.mGroupId = groupId;
        initView(context);
    }

    public TUIBarrageSendView getSendView() {
        return mBarrageSendView;
    }

    private void initView(final Context context) {
        View view = LayoutInflater.from(context).inflate(R.layout.tuibarrage_view_send, this);
        mBarrageSendView = new TUIBarrageSendView(context, mGroupId);
        findViewById(R.id.iv_linkto_send_dialog).setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                if (!mBarrageSendView.isShowing()) {
                    showSendDialog();
                }
            }
        });
    }

    //弹幕发送弹框显示,宽度自适应屏幕
    private void showSendDialog() {
        Window window = mBarrageSendView.getWindow();
        window.getDecorView().setPadding(0, 0, 0, 0);
        WindowManager.LayoutParams layoutParams = window.getAttributes();
        layoutParams.width = WindowManager.LayoutParams.MATCH_PARENT;
        window.setAttributes(layoutParams);
        mBarrageSendView.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE);
        mBarrageSendView.show();
    }
}
