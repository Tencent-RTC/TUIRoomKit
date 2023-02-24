package com.tencent.cloud.tuikit.roomkit.view.activity;

import android.content.Context;
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
import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.model.RoomEventConstant;
import com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter;
import com.tencent.cloud.tuikit.roomkit.view.component.RaiseHandApplicationListView;
import com.tencent.cloud.tuikit.roomkit.view.component.ConfirmDialogFragment;
import com.tencent.cloud.tuikit.roomkit.view.component.RoomMainView;
import com.tencent.cloud.tuikit.roomkit.view.component.QRCodeView;
import com.tencent.cloud.tuikit.roomkit.view.component.TransferMasterView;
import com.tencent.cloud.tuikit.roomkit.view.component.UserListView;

import java.lang.reflect.Method;
import java.util.Map;

public class RoomMainActivity extends AppCompatActivity implements RoomEventCenter.RoomKitUIEventResponder,
        RoomEventCenter.RoomEngineEventResponder {
    private static final String TAG = "MeetingActivity";

    private RoomMainView mMeetingView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.tuiroomkit_activity_meeting);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        initStatusBar();
        mMeetingView = new RoomMainView(this);
        ViewGroup rootView = findViewById(R.id.root_view);
        rootView.addView(mMeetingView);
        showAlertUserLiveTips();
        RoomEventCenter.getInstance().subscribeUIEvent(RoomEventCenter.RoomKitUIEvent.EXIT_MEETING, this);
        RoomEventCenter.getInstance().subscribeEngine(RoomEventCenter.RoomEngineEvent.ROOM_DISMISSED, this);
        RoomEventCenter.getInstance().subscribeEngine(RoomEventCenter.RoomEngineEvent.KICKED_OUT_OF_ROOM, this);
    }

    @Override
    public void onBackPressed() {
        UserListView userListView = mMeetingView.getUserListView();
        if (userListView != null && userListView.isShown()) {
            userListView.setVisibility(View.GONE);
            return;
        }
        QRCodeView qrCodeView = mMeetingView.getQRCodeView();
        if (qrCodeView != null && qrCodeView.isShown()) {
            qrCodeView.setVisibility(View.GONE);
            return;
        }
        RaiseHandApplicationListView raiseHandApplicationListView = mMeetingView.getAppListView();
        if (raiseHandApplicationListView != null && raiseHandApplicationListView.isShown()) {
            raiseHandApplicationListView.setVisibility(View.GONE);
            return;
        }
        TransferMasterView transferMasterView = mMeetingView.getTransferMasterView();
        if (transferMasterView != null && transferMasterView.isShown()) {
            transferMasterView.setVisibility(View.GONE);
            return;
        }
        RoomEventCenter.getInstance().notifyUIEvent(RoomEventCenter.RoomKitUIEvent.SHOW_EXIT_ROOM_VIEW, null);
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

    @Override
    protected void onDestroy() {
        super.onDestroy();
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
    public void onNotifyUIEvent(String key, Map<String, Object> params) {
        if (RoomEventCenter.RoomKitUIEvent.EXIT_MEETING.equals(key)) {
            exitRoom();
        }
    }

    private void exitRoom() {
        unSubscribeEvent();
        finish();
    }

    private void unSubscribeEvent() {
        RoomEventCenter eventCenter = RoomEventCenter.getInstance();
        eventCenter.unsubscribeUIEvent(RoomEventCenter.RoomKitUIEvent.EXIT_MEETING, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.ROOM_DISMISSED, this);
        eventCenter.unsubscribeEngine(RoomEventCenter.RoomEngineEvent.KICKED_OUT_OF_ROOM, this);
    }

    @Override
    public void onEngineEvent(RoomEventCenter.RoomEngineEvent event, Map<String, Object> params) {
        switch (event) {
            case ROOM_DISMISSED:
                Log.i(TAG, "onRoomDestroy");
                if (params == null) {
                    break;
                }
                boolean isOwner = (boolean) params.get(RoomEventConstant.KEY_IS_OWNER);
                if (isOwner) {
                    if (!isFinishing()) {
                        showDestroyDialog();
                    }
                } else {
                    ToastUtils.showShort(getString(R.string.tuiroomkit_toast_end_room));
                    showSingleConfirmDialog(getString(R.string.tuiroomkit_room_room_destroyed));
                }
                break;
            case KICKED_OUT_OF_ROOM:
                showSingleConfirmDialog(getString(R.string.tuiroomkit_kicked_by_master));
                break;
            default:
                break;
        }
    }

    private void showSingleConfirmDialog(String message) {
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
                exitRoom();
            }
        });
        dialogFragment.show(getFragmentManager(), "ConfirmDialogFragment");
    }
}
