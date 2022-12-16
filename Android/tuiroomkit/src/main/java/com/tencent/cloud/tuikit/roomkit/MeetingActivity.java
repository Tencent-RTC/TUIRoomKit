package com.tencent.cloud.tuikit.roomkit;

import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;

import androidx.appcompat.app.AppCompatActivity;

import com.blankj.utilcode.util.ToastUtils;
import com.tencent.cloud.tuikit.engine.room.TUIRoomEngine;
import com.tencent.cloud.tuikit.engine.room.TUIRoomObserver;
import com.tencent.cloud.tuikit.roomkit.model.util.PermissionHelper;
import com.tencent.cloud.tuikit.roomkit.model.manager.RoomEngineManager;
import com.tencent.cloud.tuikit.roomkit.view.ConfirmDialogFragment;
import com.tencent.cloud.tuikit.roomkit.view.MeetingView;
import com.tencent.cloud.tuikit.roomkit.view.UserListView;

import java.lang.reflect.Method;

public class MeetingActivity extends AppCompatActivity {
    private static final String TAG             = "MeetingActivity";
    private static final String KEY_ROOM_ID     = "room_id";
    public static final  String KEY_OPEN_AUDIO  = "open_audio";
    public static final  String KEY_OPEN_CAMERA = "open_camera";

    private String            mRoomId;
    private boolean           mIsPaused;
    private boolean           mIsRoomOwner;
    private boolean           mOpenCamera;
    private boolean           mOpenAudio;
    private Context           mContext;
    private MeetingView       mMeetingView;
    private TUIRoomEngine     mTUIRoomEngine;
    private RoomEngineManager mRoomEngineManager;

    public static void enterRoom(Context context, String roomId, boolean openCamera, boolean openAudio) {
        Intent starter = new Intent(context, MeetingActivity.class);
        starter.putExtra(KEY_ROOM_ID, roomId);
        starter.putExtra(KEY_OPEN_CAMERA, openCamera);
        starter.putExtra(KEY_OPEN_AUDIO, openAudio);
        starter.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(starter);
    }

    private void initData() {
        Intent intent = getIntent();
        mRoomId = intent.getStringExtra(KEY_ROOM_ID);
        mOpenCamera = intent.getBooleanExtra(KEY_OPEN_CAMERA, true);
        mOpenAudio = intent.getBooleanExtra(KEY_OPEN_AUDIO, true);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.tuiroomkit_activity_meeting);
        mContext = this;
        mRoomEngineManager = RoomEngineManager.sharedInstance(this);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        initStatusBar();
        initData();
        mTUIRoomEngine = mRoomEngineManager.getRoomEngine(mRoomId);
        mMeetingView = new MeetingView(this, mRoomId);
        ViewGroup rootView = findViewById(R.id.root_view);
        rootView.addView(mMeetingView);
        mMeetingView.setOnExitRoomClickListener(new MeetingView.OnExitRoomClickListener() {
            @Override
            public void onExitRoomClick() {
                preExitRoom();
            }
        });
        if (mOpenAudio) {
            PermissionHelper.requestPermission(mContext, PermissionHelper.PERMISSION_MICROPHONE,
                    new PermissionHelper.PermissionCallback() {
                        @Override
                        public void onGranted() {
                            mMeetingView.updateAudioButton(true);
                            mOpenAudio = true;
                            mMeetingView.enableMicrophone(true);
                            if (mOpenCamera) {
                                requestCameraPermission();
                            }
                        }

                        @Override
                        public void onDenied() {
                            mMeetingView.updateAudioButton(false);
                            mOpenAudio = false;
                        }

                        @Override
                        public void onDialogApproved() {
                            mMeetingView.updateAudioButton(true);
                            mOpenAudio = true;
                            if (mOpenCamera) {
                                requestCameraPermission();
                            }
                        }

                        @Override
                        public void onDialogRefused() {
                            mMeetingView.updateAudioButton(false);
                            mOpenAudio = false;
                            if (mOpenCamera) {
                                requestCameraPermission();
                            }
                        }
                    });
        } else if (mOpenCamera) {
            requestCameraPermission();
        }
        showAlertUserLiveTips();
        mTUIRoomEngine = mRoomEngineManager.getRoomEngine(mRoomId);
        mTUIRoomEngine.addObserver(mObserver);
        mIsRoomOwner = mRoomEngineManager.isRoomOwner(mRoomId);
    }

    @Override
    public void onBackPressed() {
        UserListView userListView = mMeetingView.getUserListView();
        if (userListView.isShown()) {
            userListView.setVisibility(View.GONE);
            return;
        }
        preExitRoom();
    }

    private void requestCameraPermission() {
        PermissionHelper.requestPermission(mContext, PermissionHelper.PERMISSION_CAMERA,
                new PermissionHelper.PermissionCallback() {
                    public void onGranted() {
                        mMeetingView.updateVideoButton(true);
                        mMeetingView.enableCamera(true);
                        mOpenCamera = true;
                    }

                    @Override
                    public void onDenied() {
                        mOpenCamera = false;
                        mMeetingView.updateVideoButton(false);
                    }

                    @Override
                    public void onDialogApproved() {
                        mMeetingView.updateVideoButton(false);
                        mOpenCamera = false;
                    }

                    @Override
                    public void onDialogRefused() {
                        mMeetingView.updateVideoButton(false);
                        mOpenCamera = false;
                    }
                });
    }

    private void initStatusBar() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.TRANSPARENT);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        }
    }

    private void preExitRoom() {
        String notifyMsg = "";
        if (mIsRoomOwner) {
            notifyMsg = mContext.getString(R.string.tuiroomkit_msg_room_owner_exit_room);
        } else {
            notifyMsg = mContext.getString(R.string.tuiroomkit_msg_room_enter_exit_room);
        }
        showExitInfoDialog(notifyMsg, false);
    }

    private void showExitInfoDialog(String msg, Boolean isError) {
        final ConfirmDialogFragment dialogFragment = new ConfirmDialogFragment();
        dialogFragment.setCancelable(true);
        dialogFragment.setMessage(msg);
        if (dialogFragment.isAdded()) {
            dialogFragment.dismiss();
            return;
        }
        if (!isError) {
            dialogFragment.setPositiveText(mContext.getString(R.string.tuiroomkit_dialog_ok));
            dialogFragment.setNegativeText(mContext.getString(R.string.tuiroomkit_dialog_cancel));
            dialogFragment.setPositiveClickListener(new ConfirmDialogFragment.PositiveClickListener() {
                @Override
                public void onClick() {
                    dialogFragment.dismiss();
                    mRoomEngineManager.exitRoom(mRoomId);
                    finish();
                }
            });
            dialogFragment.setNegativeClickListener(new ConfirmDialogFragment.NegativeClickListener() {
                @Override
                public void onClick() {
                    dialogFragment.dismiss();
                }
            });
        } else {
            dialogFragment.setPositiveText(mContext.getString(R.string.tuiroomkit_dialog_ok));
            dialogFragment.setPositiveClickListener(new ConfirmDialogFragment.PositiveClickListener() {
                @Override
                public void onClick() {
                    dialogFragment.dismiss();
                }
            });
        }
        dialogFragment.show(getFragmentManager(), "ConfirmDialogFragment");
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        mTUIRoomEngine.removeObserver(mObserver);
    }

    private void showAlertUserLiveTips() {
        if (!isFinishing()) {
            try {
                Class clz = Class.forName("com.tencent.liteav.privacy.util.RTCubeAppLegalUtils");
                Method method = clz.getDeclaredMethod("showAlertUserLiveTips", Context.class);
                method.invoke(null, this);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }


    private void showDestroyDialog() {
        try {
            Class clz = Class.forName("com.tencent.liteav.privacy.util.RTCubeAppLegalUtils");
            Method method = clz.getDeclaredMethod("showRoomDestroyTips", Context.class);
            method.invoke(null, this);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    @Override
    protected void onResume() {
        super.onResume();
        mIsPaused = false;
    }

    @Override
    protected void onPause() {
        super.onPause();
        mIsPaused = true;
    }

    private void showSingleConfirmDialog(String message) {
        if (mIsPaused) {
            finish();
            return;
        }
        final ConfirmDialogFragment dialogFragment = new ConfirmDialogFragment();
        dialogFragment.setCancelable(true);
        dialogFragment.setMessage(message);
        if (dialogFragment.isAdded()) {
            dialogFragment.dismiss();
            return;
        }
        dialogFragment.setPositiveText(getString(R.string.tuiroomkit_dialog_ok));
        dialogFragment.setPositiveClickListener(new ConfirmDialogFragment.PositiveClickListener() {
            @Override
            public void onClick() {
                dialogFragment.dismiss();
                finish();
            }
        });
        dialogFragment.show(getFragmentManager(), "ConfirmDialogFragment");
    }


    private final TUIRoomObserver mObserver = new TUIRoomObserver() {
        @Override
        public void onRoomDismissed(String roomId) {
            Log.i(TAG, "onRoomDestroy");
            if (mIsRoomOwner) {
                if (!isFinishing()) {
                    showDestroyDialog();
                }
            } else {
                ToastUtils.showShort(getString(R.string.tuiroomkit_toast_end_room));
                showSingleConfirmDialog(getString(R.string.tuiroomkit_room_room_destroyed));
            }
            mRoomEngineManager.exitRoom(mRoomId);
        }

        @Override
        public void onKickedOutOfRoom(String roomId, String s) {
            Log.i(TAG, "TUIRoomEngineObserver  onKickedOutOfRoom" + s);
            showSingleConfirmDialog(getString(R.string.tuiroomkit_kicked_by_master));
            mRoomEngineManager.exitRoom(mRoomId);
        }
    };
}
