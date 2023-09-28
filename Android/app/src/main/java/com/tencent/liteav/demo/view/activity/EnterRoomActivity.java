package com.tencent.liteav.demo.view.activity;

import static com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter.RoomEngineEvent.LOCAL_USER_ENTER_ROOM;

import android.os.Bundle;
import android.view.ViewGroup;

import androidx.appcompat.app.AppCompatActivity;

import com.tencent.cloud.tuikit.roomkit.model.RoomEventCenter;
import com.tencent.liteav.demo.R;
import com.tencent.liteav.demo.view.component.EnterRoomView;
import com.tencent.qcloud.tuicore.interfaces.TUICallback;

import java.util.Map;

public class EnterRoomActivity extends AppCompatActivity implements RoomEventCenter.RoomEngineEventResponder {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.tuiroomkit_activity_enter_room);
        EnterRoomView enterRoomView = new EnterRoomView(this);
        ViewGroup root = findViewById(R.id.ll_root_enter_room);
        root.addView(enterRoomView);
        enterRoomView.setFinishCallback(new TUICallback() {
            @Override
            public void onSuccess() {
                finish();
            }

            @Override
            public void onError(int errorCode, String errorMessage) {

            }
        });
        registerRoomEnteredEvent();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        unRegisterRoomEnteredEvent();
    }

    private void registerRoomEnteredEvent() {
        RoomEventCenter.getInstance().subscribeEngine(LOCAL_USER_ENTER_ROOM, this);
    }

    private void unRegisterRoomEnteredEvent() {
        RoomEventCenter.getInstance().unsubscribeEngine(LOCAL_USER_ENTER_ROOM, this);
    }

    @Override
    public void onEngineEvent(RoomEventCenter.RoomEngineEvent event, Map<String, Object> params) {
        if (LOCAL_USER_ENTER_ROOM == event) {
            finish();
            return;
        }
    }
}
