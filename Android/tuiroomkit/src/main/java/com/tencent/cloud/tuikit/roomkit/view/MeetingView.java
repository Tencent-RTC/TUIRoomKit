package com.tencent.cloud.tuikit.roomkit.view;

import android.app.Activity;
import android.content.Context;
import android.graphics.PixelFormat;
import android.os.Build;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.RelativeLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.DialogFragment;

import com.blankj.utilcode.util.PermissionUtils;
import com.blankj.utilcode.util.ToastUtils;
import com.tencent.cloud.tuikit.engine.common.TUICommonDefine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomDefine;
import com.tencent.cloud.tuikit.roomkit.model.entity.RoomInfo;
import com.tencent.qcloud.tuicore.util.ToastUtil;
import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.model.entity.BottomItemData;
import com.tencent.cloud.tuikit.roomkit.model.entity.BottomSelectItemData;
import com.tencent.cloud.tuikit.roomkit.model.util.PermissionHelper;
import com.tencent.cloud.tuikit.roomkit.model.entity.UserEntity;
import com.tencent.cloud.tuikit.roomkit.presenter.IMeetingViewPresenter;
import com.tencent.cloud.tuikit.roomkit.presenter.MeetingViewPresenter;

import java.util.ArrayList;
import java.util.List;

public class MeetingView extends RelativeLayout implements TopView.OnItemClickListener,
        UserListView.OnUserListItemClickListener, IMeetingView,
        ExtensionView.OnExtensionItemChangeListener {
    private static final String TAG = "MeetingView";

    private String                  mRoomId;
    private Context                 mContext;
    private View                    mScreenCaptureGroup;
    private View                    mFloatingWindow;
    private TextView                mStopScreenCaptureTv;
    private TopView                 mTopView;
    private BottomView              mBottomView;
    private RelativeLayout          mLayoutVideoSeat;
    private RelativeLayout          mLayoutUserList;
    private RelativeLayout          mLayoutBarrageShow;
    private UserListView            mUserListView;
    private ExtensionView           mExtensionView;
    private IMeetingViewPresenter   mPresenter;
    private OnExitRoomClickListener mOnExitRoomClickListener;

    public MeetingView(Context context, String roomId) {
        super(context);
        mContext = context;
        mRoomId = roomId;
        initView();
    }

    private void initView() {
        View.inflate(mContext, R.layout.tuiroomkit_view_meeting, this);
        mPresenter = new MeetingViewPresenter(mContext, mRoomId, this);

        mLayoutVideoSeat = findViewById(R.id.rl_video_seat_container);
        mLayoutBarrageShow = findViewById(R.id.rl_barrage_show);
        mScreenCaptureGroup = findViewById(R.id.group_screen_capture);
        mStopScreenCaptureTv = findViewById(R.id.tv_stop_screen_capture);

        mLayoutUserList = findViewById(R.id.rl_user_list_container);
        mUserListView = new UserListView(mContext);
        mUserListView.setRemoteUser(mPresenter.getUserEntityList());
        RelativeLayout.LayoutParams params = new RelativeLayout
                .LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT);
        mLayoutUserList.addView(mUserListView, params);
        mUserListView.setVisibility(GONE);
        mUserListView.setOnItemClickListener(this);


        mBottomView = new BottomView(mContext, createBottomItemDataList());
        ViewGroup bottomLayout = findViewById(R.id.bottom_view);
        bottomLayout.addView(mBottomView);

        mTopView = new TopView(mContext);
        mTopView.setOnItemClickListener(this);
        ViewGroup topLayout = findViewById(R.id.top_view);
        topLayout.addView(mTopView);

        RoomInfo roomInfo = mPresenter.getRoomInfo();
        mTopView.setTitle(roomInfo.roomId);
        mTopView.setHeadsetImg(true);

        setBarrageDisPlayView(mPresenter.getBarrageDisPlayView());
        setVideoSeatView(mPresenter.getVideoSeatView());
        setExtensionView();
    }

    public UserListView getUserListView() {
        return mUserListView;
    }

    private void setExtensionView() {
        mExtensionView = new ExtensionView();
        mExtensionView.setFeatureItemChangeListener(this);
    }

    private void setBarrageDisPlayView(View view) {
        if (view == null) {
            return;
        }
        RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT);
        mLayoutBarrageShow.addView(view, params);
    }

    private void setVideoSeatView(View view) {
        if (view == null) {
            return;
        }
        RelativeLayout.LayoutParams params = new RelativeLayout
                .LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
        mLayoutVideoSeat.addView(view, params);
    }

    public void updateAudioButton(boolean isSelected) {
        mBottomView.updateButtonSelectStatus(BottomItemData.Type.AUDIO, isSelected);
    }

    public void updateVideoButton(boolean isSelected) {
        mBottomView.updateButtonSelectStatus(BottomItemData.Type.VIDEO, isSelected);
    }

    @Override
    protected void onDetachedFromWindow() {
        mPresenter.destroyPresenter();
        super.onDetachedFromWindow();
    }

    @Override
    public void onHeadSetClick(boolean isUseSpeaker) {
        mPresenter.switchAudioRoute(isUseSpeaker);
    }

    @Override
    public void onSwitchCameraClick() {
        mPresenter.switchCamera();
    }

    @Override
    public void onExitRoomClick() {
        if (mOnExitRoomClickListener != null) {
            mOnExitRoomClickListener.onExitRoomClick();
        }
    }

    @Override
    public void onReportClick() {
        mPresenter.report();
    }

    private void onMicrophoneClick(boolean isSelect) {
        if (isSelect) {
            PermissionHelper.requestPermission(mContext, PermissionHelper.PERMISSION_MICROPHONE,
                    new PermissionHelper.PermissionCallback() {
                        @Override
                        public void onGranted() {
                            updateAudioButton(true);
                            mPresenter.enableMicrophone(true);
                        }

                        @Override
                        public void onDenied() {
                            updateAudioButton(false);
                            mPresenter.enableMicrophone(false);
                        }

                        @Override
                        public void onDialogApproved() {
                            updateAudioButton(true);
                        }

                        @Override
                        public void onDialogRefused() {
                            updateAudioButton(false);

                        }
                    });
        } else {
            updateAudioButton(false);
            mPresenter.enableMicrophone(false);
        }
    }

    private void onCameraClick(boolean isSelect) {
        if (isSelect) {
            PermissionHelper.requestPermission(mContext, PermissionHelper.PERMISSION_CAMERA,
                    new PermissionHelper.PermissionCallback() {

                        public void onGranted() {
                            updateVideoButton(true);
                            mPresenter.enableCamera(true);
                        }

                        @Override
                        public void onDenied() {
                            updateVideoButton(false);
                            mPresenter.enableCamera(false);
                        }

                        @Override
                        public void onDialogApproved() {
                            updateVideoButton(false);
                        }

                        @Override
                        public void onDialogRefused() {
                            updateVideoButton(false);
                        }
                    });
        } else {
            updateVideoButton(false);
            mPresenter.enableCamera(false);
        }
    }

    private List<BottomItemData> createBottomItemDataList() {
        BottomItemData micItemData = new BottomItemData();
        micItemData.setType(BottomItemData.Type.AUDIO);
        micItemData.setEnable(mPresenter.getRoomInfo().enableAudio);
        micItemData.setIconId(R.drawable.tuiroomkit_ic_mic_off);
        micItemData.setDisableIconId(R.drawable.tuiroomkit_ic_mic_disabled);
        BottomSelectItemData micSelectItemData = new BottomSelectItemData();
        boolean isMicSelect = mPresenter.getRoomInfo().enableAudio
                && mPresenter.getRoomInfo().isOpenMicrophone;
        micSelectItemData.setSelected(isMicSelect);
        micSelectItemData.setSelectedIconId(R.drawable.tuiroomkit_ic_mic_on);
        micSelectItemData.setUnSelectedIconId(R.drawable.tuiroomkit_ic_mic_off);
        micSelectItemData.setOnItemSelectListener(new BottomSelectItemData.OnItemSelectListener() {
            @Override
            public void onItemSelected(boolean isSelected) {
                onMicrophoneClick(isSelected);
            }
        });
        micItemData.setSelectItemData(micSelectItemData);
        List<BottomItemData> list = new ArrayList<>();
        list.add(micItemData);

        BottomItemData cameraItemData = new BottomItemData();
        cameraItemData.setType(BottomItemData.Type.VIDEO);
        cameraItemData.setEnable(mPresenter.getRoomInfo().enableVideo);
        cameraItemData.setIconId(R.drawable.tuiroomkit_ic_camera_off);
        cameraItemData.setDisableIconId(R.drawable.tuiroomkit_ic_camera_disabled);
        BottomSelectItemData camaraSelectItemData = new BottomSelectItemData();
        boolean isCamSelect = mPresenter.getRoomInfo().enableVideo
                && mPresenter.getRoomInfo().isOpenCamera;
        camaraSelectItemData.setSelected(isCamSelect);
        camaraSelectItemData.setSelectedIconId(R.drawable.tuiroomkit_ic_camera_on);
        camaraSelectItemData.setUnSelectedIconId(R.drawable.tuiroomkit_ic_camera_off);
        camaraSelectItemData.setOnItemSelectListener(new BottomSelectItemData.OnItemSelectListener() {
            @Override
            public void onItemSelected(boolean isSelected) {
                onCameraClick(isSelected);
            }
        });
        cameraItemData.setSelectItemData(camaraSelectItemData);
        list.add(cameraItemData);

        if (mPresenter.getBeautyView() != null) {
            BottomItemData beautyItemData = new BottomItemData();
            beautyItemData.setType(BottomItemData.Type.BEAUTY);
            beautyItemData.setEnable(true);
            beautyItemData.setIconId(R.drawable.tuiroomkit_ic_beauty);
            beautyItemData.setView(mPresenter.getBeautyView());
            list.add(beautyItemData);
        }

        BottomItemData memberItemData = new BottomItemData();
        memberItemData.setType(BottomItemData.Type.MEMBER_LIST);
        memberItemData.setEnable(true);
        memberItemData.setIconId(R.drawable.tuiroomkit_ic_member);
        memberItemData.setOnItemClickListener(new BottomItemData.OnItemClickListener() {
            @Override
            public void onItemClick() {
                if (mUserListView.isShown()) {
                    mUserListView.setVisibility(View.GONE);
                } else {
                    mUserListView.setVisibility(View.VISIBLE);
                }
            }
        });
        list.add(memberItemData);

        if (mPresenter.getBarrageSendView() != null) {
            BottomItemData barrageItemData = new BottomItemData();
            barrageItemData.setType(BottomItemData.Type.BARRAGE);
            barrageItemData.setEnable(true);
            barrageItemData.setIconId(R.drawable.tuiroomkit_barrage_icon);
            barrageItemData.setView(mPresenter.getBarrageSendView());
            list.add(barrageItemData);
        }

        BottomItemData extensionItemData = new BottomItemData();
        extensionItemData.setEnable(true);
        extensionItemData.setIconId(R.drawable.tuiroomkit_ic_more);
        extensionItemData.setType(BottomItemData.Type.EXTENSION);
        extensionItemData.setOnItemClickListener(new BottomItemData.OnItemClickListener() {
            @Override
            public void onItemClick() {
                showDialogFragment(mExtensionView, "FeatureSettingFragmentDialog");
            }
        });
        list.add(extensionItemData);
        return list;
    }

    private void showDialogFragment(DialogFragment dialogFragment, String tag) {
        if (dialogFragment != null) {
            if (dialogFragment.isVisible()) {
                try {
                    dialogFragment.dismissAllowingStateLoss();
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
            } else {
                if (!dialogFragment.isAdded()) {
                    dialogFragment.show(((AppCompatActivity) getContext()).getSupportFragmentManager(), tag);
                }
            }
        }
    }

    private void showKickDialog(final String userId, String userName) {
        final ConfirmDialogFragment dialogFragment = new ConfirmDialogFragment();
        dialogFragment.setCancelable(true);
        dialogFragment.setMessage(mContext.getString(R.string.tuiroomkit_kick_user_confirm, userName));
        if (dialogFragment.isAdded()) {
            dialogFragment.dismiss();
            mUserListView.disableKickUser(false);
            return;
        }
        dialogFragment.setPositiveText(mContext.getString(R.string.tuiroomkit_dialog_ok));
        dialogFragment.setNegativeText(mContext.getString(R.string.tuiroomkit_dialog_cancel));
        dialogFragment.setPositiveClickListener(new ConfirmDialogFragment.PositiveClickListener() {
            @Override
            public void onClick() {
                mPresenter.kickUser(userId, new TUIRoomDefine.ActionCallback() {
                    @Override
                    public void onSuccess() {
                        mUserListView.disableKickUser(false);
                        dialogFragment.dismiss();
                    }

                    @Override
                    public void onError(TUICommonDefine.Error error, String s) {
                        Log.d(TAG, "the user not in group");
                        mUserListView.disableKickUser(false);
                        dialogFragment.dismiss();
                    }
                });
            }
        });

        dialogFragment.setNegativeClickListener(new ConfirmDialogFragment.NegativeClickListener() {
            @Override
            public void onClick() {
                dialogFragment.dismiss();
                mUserListView.disableKickUser(false);
            }
        });
        dialogFragment.show(((Activity) mContext).getFragmentManager(), "ConfirmDialogFragment");
    }

    public void setOnExitRoomClickListener(OnExitRoomClickListener listener) {
        mOnExitRoomClickListener = listener;
    }

    private void onShareScreenClick() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!PermissionUtils.isGrantedDrawOverlays()) {
                ToastUtils.showLong(getResources()
                        .getString(R.string.tuiroomkit_toast_need_floating_window_permission));
                PermissionUtils.requestDrawOverlays(new PermissionUtils.SimpleCallback() {
                    @Override
                    public void onGranted() {
                        startScreenCapture();
                    }

                    @Override
                    public void onDenied() {
                        ToastUtils.showLong(getResources()
                                .getString(R.string.tuiroomkit_toast_need_floating_window_permission));
                    }
                });
            } else {
                startScreenCapture();
            }
        } else {
            startScreenCapture();
        }
    }

    private void startScreenCapture() {
        mLayoutVideoSeat.setVisibility(View.GONE);
        mScreenCaptureGroup.setVisibility(View.VISIBLE);
        mBottomView.setVisibility(GONE);
        mTopView.setVisibility(GONE);

        mStopScreenCaptureTv.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                stopScreenCapture();
            }
        });
        mPresenter.startScreenShare();

        if (mFloatingWindow == null) {
            LayoutInflater inflater = LayoutInflater.from(getContext());
            mFloatingWindow = inflater.inflate(R.layout.tuiroomkit_screen_capture_floating_window, null, false);
            mFloatingWindow.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    Log.d(TAG, "onClick: 悬浮窗");
                }
            });
        }
        showFloatingWindow();
    }

    private void stopScreenCapture() {
        hideFloatingWindow();
        mPresenter.stopScreenShare();
        mLayoutVideoSeat.setVisibility(View.VISIBLE);
        mScreenCaptureGroup.setVisibility(View.GONE);
        mBottomView.setVisibility(View.VISIBLE);
        mTopView.setVisibility(View.VISIBLE);
    }

    private void showFloatingWindow() {
        if (mFloatingWindow == null) {
            return;
        }
        WindowManager windowManager =
                (WindowManager) mFloatingWindow.getContext().getSystemService(Context.WINDOW_SERVICE);
        if (windowManager == null) {
            return;
        }
        int type = WindowManager.LayoutParams.TYPE_TOAST;
        if (Build.VERSION.SDK_INT >= 26) {
            type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else if (Build.VERSION.SDK_INT > Build.VERSION_CODES.N) {
            type = WindowManager.LayoutParams.TYPE_PHONE;
        }
        WindowManager.LayoutParams layoutParams = new WindowManager.LayoutParams(type);
        layoutParams.flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
        layoutParams.flags |= WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH;
        layoutParams.width = WindowManager.LayoutParams.WRAP_CONTENT;
        layoutParams.height = WindowManager.LayoutParams.WRAP_CONTENT;
        layoutParams.format = PixelFormat.TRANSLUCENT;
        layoutParams.gravity = Gravity.RIGHT;
        windowManager.addView(mFloatingWindow, layoutParams);
    }

    private void hideFloatingWindow() {
        if (mFloatingWindow == null) {
            return;
        }
        WindowManager windowManager =
                (WindowManager) mFloatingWindow.getContext().getSystemService(Context.WINDOW_SERVICE);
        if (windowManager != null) {
            windowManager.removeViewImmediate(mFloatingWindow);
        }
        mFloatingWindow = null;
    }

    @Override
    public void enableCamera(boolean enable) {
        if (mPresenter != null) {
            mPresenter.enableCamera(enable);
        }
    }

    @Override
    public void enableMicrophone(boolean enable) {
        if (mPresenter != null) {
            mPresenter.enableMicrophone(enable);
        }
    }

    @Override
    public void enableShareButton(boolean enable) {
        mExtensionView.enableShareButton(enable);
    }

    @Override
    public void onCameraMuted(boolean muted) {
        if (muted) {
            ToastUtil.toastShortMessage(mContext.getString(R.string.tuiroomkit_mute_video_by_master));
        } else {
            ToastUtil.toastShortMessage(mContext.getString(R.string.tuiroomkit_un_mute_video_by_master));
        }
        updateVideoButton(!muted);
    }

    @Override
    public void onMicrophoneMuted(boolean muted) {
        if (muted) {
            ToastUtil.toastShortMessage(mContext.getString(R.string.tuiroomkit_mute_audio_by_master));
        } else {
            ToastUtil.toastShortMessage(mContext.getString(R.string.tuiroomkit_un_mute_audio_by_master));
        }
        updateAudioButton(!muted);
    }

    @Override
    public void disableCameraButton(boolean disable) {
        mBottomView.disableCameraButton(disable);
    }

    @Override
    public void disableMicrophoneButton(boolean disable) {
        mBottomView.disableMicrophoneButton(disable);
    }

    @Override
    public void setRoomOwner(boolean isOwner) {
        mUserListView.setOwner(isOwner);
    }

    @Override
    public void disableMuteAllVideo(boolean disable) {
        mUserListView.disableMuteAllVideo(disable);
    }

    @Override
    public void disableMuteAllAudio(boolean disable) {
        mUserListView.disableMuteAllAudio(disable);
    }

    @Override
    public void disableMuteAudio(boolean disable) {
        mUserListView.disableMuteAudio(disable);
    }

    @Override
    public void disableMuteVideo(boolean disable) {
        mUserListView.disableMuteVideo(disable);
    }

    @Override
    public void addRemoteUser(UserEntity memberEntity) {
        mUserListView.addRemoteUser(memberEntity);
    }

    @Override
    public void removeRemoteUser(String userId) {
        mUserListView.removeRemoteUser(userId);
    }

    @Override
    public void updateRemoteUserVideo(String userId, boolean available) {
        mUserListView.updateRemoteUserVideo(userId, available);
    }

    @Override
    public void updateRemoteUserInfo(String userId, String userName, String userAvatar) {
        mUserListView.updateRemoteUserInfo(userId, userName, userAvatar);
    }

    @Override
    public void updateRemoteUserAudio(String userId, boolean available) {
        mUserListView.updateRemoteUserAudio(userId, available);
    }

    @Override
    public void onMuteUserAudio(boolean mute, String userId) {
        mPresenter.muteUserAudio(userId, mute);
    }

    @Override
    public void onMuteUserVideo(boolean mute, String userId) {
        mPresenter.muteUserVideo(userId, mute);
    }

    @Override
    public void onMuteAllUserAudio(boolean mute) {
        mPresenter.muteAllUserAudio(mute);
    }

    @Override
    public void onMuteAllUserVideo(boolean mute) {
        mPresenter.muteAllUserVideo(mute);
    }

    @Override
    public void onKickUser(String userId, String userName) {
        showKickDialog(userId, userName);
    }

    @Override
    public void onStartScreenShareClick() {
        onShareScreenClick();
    }

    @Override
    public void onAudioCaptureVolumeChange(int volume) {
        mPresenter.setAudioCaptureVolume(volume);
    }

    @Override
    public void onAudioPlayVolumeChange(int volume) {
        mPresenter.setAudioPlayVolume(volume);
    }

    @Override
    public void onAudioEvaluationEnableChange(boolean enable) {
        mPresenter.enableAudioEvaluation(enable);
    }

    @Override
    public void onStartFileDumping(String path) {
        mPresenter.startFileDumping(path);
    }

    @Override
    public void onStopFileDumping() {
        mPresenter.stopFileDumping();
    }

    @Override
    public void onVideoBitrateChange(int bitrate) {
        mPresenter.setVideoBitrate(bitrate);
    }

    @Override
    public void onVideoResolutionChange(int resolution) {
        mPresenter.setVideoResolution(resolution);
    }

    @Override
    public void onVideoFpsChange(int fps) {
        mPresenter.setVideoFps(fps);
    }

    @Override
    public void onVideoMirrorChange(boolean mirror) {
        mPresenter.setVideoMirror(mirror);
    }

    public interface OnExitRoomClickListener {
        void onExitRoomClick();
    }
}
