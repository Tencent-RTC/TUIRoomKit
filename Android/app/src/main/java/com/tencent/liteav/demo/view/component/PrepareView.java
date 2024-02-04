package com.tencent.liteav.demo.view.component;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.view.View;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;

import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.constraintlayout.widget.ConstraintSet;

import com.tencent.cloud.tuikit.roomkit.model.manager.RoomEngineManager;
import com.tencent.cloud.tuikit.roomkit.utils.ImageLoader;
import com.tencent.liteav.demo.R;
import com.tencent.qcloud.tuicore.TUICore;
import com.tencent.qcloud.tuicore.TUILogin;
import com.tencent.qcloud.tuicore.interfaces.TUICallback;
import com.tencent.qcloud.tuicore.util.ToastUtil;

import de.hdodenhof.circleimageview.CircleImageView;

public class PrepareView extends RelativeLayout implements View.OnClickListener {

    private Context          mContext;
    private TextView         mTextUserName;
    private TextView         mTextVersion;
    private ImageView        mImageBack;
    private CircleImageView  mImageHead;
    private LinearLayout     mLayoutEnterRoom;
    private LinearLayout     mLayoutCreateRoom;
    private ConstraintLayout mLayoutRoot;
    private ConstraintSet    mPreSet;

    private TUICallback mFinishCallback;

    public PrepareView(Context context, boolean enablePreview) {
        super(context);
        mContext = context;
        initView();
        updatePreviewLayout(enablePreview);
    }

    public void setFinishCallback(TUICallback finishCallback) {
        mFinishCallback = finishCallback;
    }

    private void initView() {
        View.inflate(mContext, R.layout.app_view_prepare, this);

        mLayoutRoot = findViewById(R.id.cl_root_prepare);
        mImageHead = findViewById(R.id.img_head_prepare);
        mTextVersion = findViewById(R.id.tuiroomkit_version);
        mTextUserName = findViewById(R.id.tv_name_prepare);
        mImageBack = findViewById(R.id.img_back);
        mLayoutEnterRoom = findViewById(R.id.ll_enter_room);
        mLayoutCreateRoom = findViewById(R.id.ll_create_room);

        mImageBack.setOnClickListener(this);
        mImageHead.setOnClickListener(this);
        mLayoutEnterRoom.setOnClickListener(this);
        mLayoutCreateRoom.setOnClickListener(this);

        mTextVersion.setText(mContext.getString(R.string.app_version, getVersionName(mContext)));

        ImageLoader.loadImage(mContext, mImageHead, TUILogin.getFaceUrl(),
                R.drawable.app_ic_avatar);
        mTextUserName.setText(TUILogin.getNickName());

        mPreSet = new ConstraintSet();
        mPreSet.clone(mLayoutRoot);
    }

    private void updatePreviewLayout(boolean enableVideoPreview) {
        if (enableVideoPreview) {
            mPreSet.applyTo(mLayoutRoot);
        } else {
            ConstraintSet set = new ConstraintSet();
            set.clone(mLayoutRoot);
            set.clear(mLayoutCreateRoom.getId());
            set.clear(mLayoutEnterRoom.getId());

            set.centerHorizontally(mLayoutCreateRoom.getId(), ConstraintSet.PARENT_ID);
            set.constrainHeight(mLayoutCreateRoom.getId(), ConstraintSet.WRAP_CONTENT);
            set.constrainPercentWidth(mLayoutCreateRoom.getId(), 0.5f);
            set.connect(mLayoutCreateRoom.getId(), ConstraintSet.BOTTOM, mLayoutRoot.getId(),
                    ConstraintSet.BOTTOM,
                    getResources().getDimensionPixelSize(R.dimen.app_create_room_margin_bottom));
            set.connect(mLayoutCreateRoom.getId(), ConstraintSet.START, ConstraintSet.PARENT_ID, ConstraintSet.START);
            set.connect(mLayoutCreateRoom.getId(), ConstraintSet.END, ConstraintSet.PARENT_ID, ConstraintSet.END);

            set.connect(mLayoutEnterRoom.getId(), ConstraintSet.BOTTOM, mLayoutCreateRoom.getId(), ConstraintSet.TOP,
                    getResources().getDimensionPixelSize(R.dimen.app_enter_room_margin_bottom));
            set.connect(mLayoutEnterRoom.getId(), ConstraintSet.LEFT, mLayoutCreateRoom.getId(), ConstraintSet.LEFT);
            set.connect(mLayoutEnterRoom.getId(), ConstraintSet.RIGHT, mLayoutCreateRoom.getId(), ConstraintSet.RIGHT);
            set.constrainWidth(mLayoutEnterRoom.getId(), ConstraintSet.MATCH_CONSTRAINT);
            set.constrainHeight(mLayoutEnterRoom.getId(), ConstraintSet.WRAP_CONTENT);
            set.setVerticalBias(mLayoutEnterRoom.getId(), 100f);

            set.applyTo(mLayoutRoot);
        }
    }

    private String getVersionName(Context context) {
        PackageManager manager = context.getPackageManager();
        String name = "";
        try {
            PackageInfo info = manager.getPackageInfo(context.getPackageName(), 0);
            name = info.versionName;
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }
        return name;
    }



    @Override
    public void onClick(View v) {
        if (v.getId() == R.id.img_back) {
            finishActivity();
        } else if (v.getId() == R.id.ll_enter_room) {
            enterRoom();
        } else if (v.getId() == R.id.ll_create_room) {
            createRoom();
        }
    }

    private void finishActivity() {
        if (mFinishCallback != null) {
            mFinishCallback.onSuccess();
        }
    }

    private void createRoom() {
        if (RoomEngineManager.sharedInstance().getRoomStore().isInFloatWindow()) {
            ToastUtil.toastLongMessage(mContext.getString(R.string.app_room_msg_joined));
            return;
        }
        TUICore.startActivity("CreateRoomActivity", null);
    }

    private void enterRoom() {
        if (RoomEngineManager.sharedInstance().getRoomStore().isInFloatWindow()) {
            ToastUtil.toastLongMessage(mContext.getString(R.string.app_room_msg_joined));
            return;
        }
        TUICore.startActivity("EnterRoomActivity", null);
    }
}
