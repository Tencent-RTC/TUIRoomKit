package com.tencent.liteav.tuiroom.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import com.tencent.liteav.tuiroom.ui.utils.StateBarUtils;
import com.tencent.liteav.tuiroom.R;

public class TUIRoomActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.tuiroom_activity_entrance);
        StateBarUtils.setLightStatusBar(this);
        initView();
    }

    private void createRoom() {
        Intent intent = new Intent(this, CreateRoomActivity.class);
        startActivity(intent);
    }

    private void joinRoom() {
        Intent intent = new Intent(this, JoinRoomActivity.class);
        startActivity(intent);
    }

    private void initView() {
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        toolbar.setNavigationOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
        findViewById(R.id.ll_create).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                createRoom();
            }
        });
        findViewById(R.id.ll_join).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                joinRoom();
            }
        });
    }
}
