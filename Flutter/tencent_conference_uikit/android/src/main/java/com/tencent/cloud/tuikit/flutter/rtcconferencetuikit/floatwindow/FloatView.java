package com.tencent.cloud.tuikit.flutter.rtcconferencetuikit.floatwindow;

import android.content.Context;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.widget.FrameLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.constraintlayout.utils.widget.ImageFilterView;

import com.tencent.cloud.tuikit.engine.common.TUIVideoView;
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.flutter.rtcconferencetuikit.R;
import com.trtc.tuikit.common.imageloader.ImageLoader;

import de.hdodenhof.circleimageview.CircleImageView;

public class FloatView extends FrameLayout {

    private Context              mContext;
    private TUIVideoView         mVideoView;
    private ImageFilterView      mUserAvatarIv;
    private CircleImageView      mRoomOwnerView;
    private UserVolumePromptView mUserVolumePromptView;
    private TextView             mUserNameTv;


    public FloatView(@NonNull Context context) {
        super(context);
        mContext = context;
        LayoutInflater.from(mContext).inflate(R.layout.rtc_conference_uikit_float_layout, this);
        mVideoView = findViewById(R.id.tuiroomkit_room_float_video_view);
        mRoomOwnerView = findViewById(R.id.tuiroomkit_master_avatar_iv);
        mUserAvatarIv = findViewById(R.id.tuiroomkit_room_float_avatar_view);
        mUserVolumePromptView = findViewById(R.id.tuiroomkit_user_mic);
        mUserNameTv = findViewById(R.id.tuiroomkit_user_name_tv);
    }

    public TUIVideoView getVideoView() {
        return mVideoView;
    }

    public void updateFloatViewUserModel(UserModel userModel) {
        mRoomOwnerView.setVisibility(userModel.userRole == TUIRoomDefine.Role.ROOM_OWNER ? VISIBLE : GONE);
        String name = userModel.userName;
        mUserNameTv.setText(TextUtils.isEmpty(name) ? userModel.userId : name);
        mUserVolumePromptView.enableVolumeEffect(userModel.hasAudioStream);
        if(userModel.hasAudioStream){
            mUserVolumePromptView.updateVolumeEffect(userModel.volume);
        }
        ImageLoader.load(mContext, mUserAvatarIv, userModel.userAvatarURL, R.drawable.float_view_head);
        mVideoView.setVisibility(userModel.hasVideoStream || userModel.hasScreenStream ? VISIBLE : GONE);
        mUserAvatarIv.setVisibility(userModel.hasVideoStream || userModel.hasScreenStream ? GONE : VISIBLE);
    }
}
