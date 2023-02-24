package com.tencent.cloud.tuikit.roomkit.view.component;

import android.content.Context;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import android.widget.TextView;

import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.model.entity.UserModel;
import com.tencent.cloud.tuikit.roomkit.viewmodel.RaiseHandApplicationListViewModel;

public class RaiseHandApplicationListView extends ConstraintLayout implements
        View.OnClickListener {
    private Context                           mContext;
    private TextView                          mTextAgreeAll;
    private TextView                          mTextInviteMember;
    private EditText                          mEditSearch;
    private RecyclerView                      mRecyclerApplyList;
    private RaiseHandApplicationListAdapter   mAdapter;
    private RaiseHandApplicationListViewModel mViewModel;

    public RaiseHandApplicationListView(Context context) {
        super(context);
        mContext = context;
        inflate(mContext, R.layout.tuiroomkit_view_raise_hand_applies, this);
        initView(this);
        mViewModel = new RaiseHandApplicationListViewModel(mContext, this);
    }

    @Override
    public void setVisibility(int visibility) {
        if (visibility == GONE) {
            mViewModel.horizontalAnimation(false);
        } else if (visibility == VISIBLE) {
            mViewModel.horizontalAnimation(true);
        }
        super.setVisibility(visibility);
    }

    public void addItem(UserModel userModel) {
        if (mAdapter != null) {
            mAdapter.addItem(userModel);
        }
    }

    public void removeItem(UserModel userModel) {
        if (mAdapter != null) {
            mAdapter.removeItem(userModel);
        }
    }

    private void initView(View itemView) {
        mTextAgreeAll = itemView.findViewById(R.id.tv_agree_all);
        mTextInviteMember = itemView.findViewById(R.id.tv_invite_member_to_stage);
        mRecyclerApplyList = itemView.findViewById(R.id.rv_apply_list);

        mEditSearch = itemView.findViewById(R.id.et_search);

        findViewById(R.id.toolbar).setOnClickListener(this);
        mTextInviteMember.setOnClickListener(this);
        mTextAgreeAll.setOnClickListener(this);

        mEditSearch.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {

            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

            }

            @Override
            public void afterTextChanged(Editable s) {
                String userName = mEditSearch.getText().toString();
                if (TextUtils.isEmpty(userName)) {
                    mAdapter.setDataList(mViewModel.getApplyList());
                }
                mAdapter.notifyDataSetChanged();
            }
        });
        mEditSearch.setOnEditorActionListener(new TextView.OnEditorActionListener() {
            @Override
            public boolean onEditorAction(TextView v, int actionId, KeyEvent event) {
                if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                    String userName = mEditSearch.getText().toString();
                    mAdapter.setDataList(mViewModel.searchUserByName(userName));
                }
                return false;
            }
        });

        mRecyclerApplyList.setLayoutManager(new LinearLayoutManager(mContext, LinearLayoutManager.VERTICAL, false));
        mAdapter = new RaiseHandApplicationListAdapter(mContext);
        mRecyclerApplyList.setAdapter(mAdapter);
        mRecyclerApplyList.setHasFixedSize(true);
    }

    @Override
    public void onClick(View v) {
        if (v.getId() == R.id.toolbar) {
            setVisibility(GONE);
        } else if (v.getId() == R.id.tv_agree_all) {
            mViewModel.agreeAllUserOnStage();
        } else if (v.getId() == R.id.tv_invite_member_to_stage) {
            setVisibility(GONE);
            mViewModel.inviteMemberOnstage();
        }
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        mViewModel.destroy();
    }
}

