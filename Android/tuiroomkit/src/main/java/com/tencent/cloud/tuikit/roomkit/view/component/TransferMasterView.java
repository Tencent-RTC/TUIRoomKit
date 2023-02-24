package com.tencent.cloud.tuikit.roomkit.view.component;

import android.content.Context;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import androidx.appcompat.widget.Toolbar;
import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.tencent.cloud.tuikit.roomkit.R;
import com.tencent.cloud.tuikit.roomkit.model.entity.UserModel;
import com.tencent.cloud.tuikit.roomkit.viewmodel.TransferMasterViewModel;

import java.util.List;

public class TransferMasterView extends ConstraintLayout {
    private Button                  mButtonConfirmLeave;
    private Toolbar                 mToolBar;
    private EditText                mEditSearch;
    private RecyclerView            mRecyclerUserList;
    private TransferMasterAdapter   mAdapter;
    private TransferMasterViewModel mViewModel;

    public TransferMasterView(Context context) {
        super(context);
        inflate(context, R.layout.tuiroomkit_view_assign_master, this);
        mViewModel = new TransferMasterViewModel(context, this);
        initView(context);
    }

    private void initView(Context context) {
        mToolBar = findViewById(R.id.toolbar);
        mEditSearch = findViewById(R.id.et_search);
        mButtonConfirmLeave = findViewById(R.id.btn_specify_and_leave);
        mRecyclerUserList = findViewById(R.id.rv_user_list);

        mRecyclerUserList.setLayoutManager(new LinearLayoutManager(context, LinearLayoutManager.VERTICAL, false));
        mAdapter = new TransferMasterAdapter(context);
        mRecyclerUserList.setAdapter(mAdapter);
        mRecyclerUserList.setHasFixedSize(true);

        mToolBar.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                setVisibility(GONE);
            }
        });
        mButtonConfirmLeave.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                mViewModel.transferMaster(mAdapter.getSelectedUserId());
            }
        });
        mEditSearch.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {

            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                String userName = mEditSearch.getText().toString();
                if (TextUtils.isEmpty(userName)) {
                    mAdapter.setDataList(mViewModel.getUserList());
                }
            }

            @Override
            public void afterTextChanged(Editable s) {

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
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        mViewModel.destroy();
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

    @Override
    public void setVisibility(int visibility) {
        if (visibility == GONE) {
            mViewModel.horizontalAnimation(false);
        } else if (visibility == VISIBLE) {
            mViewModel.horizontalAnimation(true);
        }
        super.setVisibility(visibility);
    }
}
