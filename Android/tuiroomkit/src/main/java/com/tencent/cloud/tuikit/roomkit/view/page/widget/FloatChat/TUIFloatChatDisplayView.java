package com.tencent.cloud.tuikit.roomkit.view.page.widget.FloatChat;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Color;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.TextUtils;
import android.text.style.ForegroundColorSpan;
import android.view.LayoutInflater;
import android.widget.FrameLayout;
import android.widget.TextView;

import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.tencent.cloud.tuikit.roomkit.view.page.widget.FloatChat.view.IFloatChatDisplayView;
import com.tencent.liteav.base.Log;
import com.trtc.tuikit.common.livedata.Observer;
import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.FloatChat.service.FloatChatIMService;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.FloatChat.service.FloatChatPresenter;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.FloatChat.service.IFloatChatMessage;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.FloatChat.service.IFloatChatPresenter;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.FloatChat.store.FloatChatStore;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.FloatChat.view.adapter.FloatChatMsgListAdapter;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.FloatChat.view.adapter.TUIFloatChatDisplayAdapter;
import com.tencent.cloud.tuikit.roomkit.view.page.widget.FloatChat.model.TUIFloatChat;

import java.util.ArrayList;

@SuppressLint("ViewConstructor")
public class TUIFloatChatDisplayView extends FrameLayout implements IFloatChatDisplayView {
    private static final String TAG = "TUIBarrageDisplayView";

    private TextView              mTextNotice;
    private RecyclerView            mRecyclerMsg;
    private FloatChatMsgListAdapter mAdapter;
    private ArrayList<TUIFloatChat> mMsgList;
    private int                     mBarrageCount = 0;

    private final IFloatChatPresenter    mPresenter;
    private final Observer<TUIFloatChat> mBarrageObserver = this::insertBarrages;

    public TUIFloatChatDisplayView(Context context, String roomId) {
        this(context, new FloatChatIMService(roomId));
    }

    private TUIFloatChatDisplayView(Context context, IFloatChatMessage service) {
        super(context);
        mPresenter = new FloatChatPresenter(context, service);
        mPresenter.initDisplayView(this);
        initView(context);
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        addObserver();
    }

    private void addObserver() {
        FloatChatStore.sharedInstance().mSendBarrage.observe(mBarrageObserver);
    }

    private void removeObserver() {
        FloatChatStore.sharedInstance().mSendBarrage.removeObserver(mBarrageObserver);
    }

    private void initView(Context context) {
        LayoutInflater.from(context).inflate(R.layout.tuiroomkit_float_chat_view_display, this);
        mTextNotice = findViewById(R.id.tv_notice);
        mRecyclerMsg = findViewById(R.id.rv_msg);
        mMsgList = new ArrayList<>();
        mAdapter = new FloatChatMsgListAdapter(context, mMsgList, null);
        mRecyclerMsg.setLayoutManager(new LinearLayoutManager(context));
        mRecyclerMsg.setAdapter(mAdapter);
    }

    private void setNotice(String username, String notice) {
        username = TextUtils.isEmpty(username) ? "" : username;
        notice = TextUtils.isEmpty(notice) ? "" : notice;
        String result = username + notice;
        SpannableStringBuilder builder = new SpannableStringBuilder(result);
        ForegroundColorSpan redSpan = new ForegroundColorSpan(Color.BLUE);
        builder.setSpan(redSpan, 0, username.length(), Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
        mTextNotice.setText(builder);
        mTextNotice.setBackgroundResource(R.drawable.tuiroomkit_float_chat_bg_msg_item);
    }

    public void setAdapter(TUIFloatChatDisplayAdapter adapter) {
        mAdapter.setCustomAdapter(adapter);
    }

    public void destroyPresenter() {
        mPresenter.destroyPresenter();
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        removeObserver();
        FloatChatStore.sharedInstance().mSendBarrage.set(null);
    }

    @SuppressLint("NotifyDataSetChanged")
    @Override
    public void insertBarrages(TUIFloatChat... barrages) {
        if (barrages == null) {
            return;
        }
        for (TUIFloatChat barrage : barrages) {
            if (barrage == null) {
                Log.e(TAG, " insertBarrage barrages is empty");
                continue;
            }
            String message = barrage.content;
            Log.i(TAG, " insertBarrage message = " + message);
            mMsgList.add(barrage);
            mBarrageCount++;
        }
        mAdapter.notifyDataSetChanged();
        mRecyclerMsg.smoothScrollToPosition(mAdapter.getItemCount());
    }

    public int getBarrageCount() {
        return mBarrageCount;
    }
}
