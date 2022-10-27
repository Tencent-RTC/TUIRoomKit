package com.tencent.qcloud.tuikit.tuibarrage.view;

import android.app.Dialog;
import android.content.Context;
import android.graphics.PorterDuff;
import android.text.InputType;
import android.text.TextUtils;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import com.tencent.qcloud.tuicore.TUILogin;
import com.tencent.qcloud.tuikit.tuibarrage.R;
import com.tencent.qcloud.tuikit.tuibarrage.model.TUIBarrageConstants;
import com.tencent.qcloud.tuikit.tuibarrage.model.TUIBarrageModel;
import com.tencent.qcloud.tuikit.tuibarrage.presenter.ITUIBarragePresenter;
import com.tencent.qcloud.tuikit.tuibarrage.presenter.TUIBarrageCallBack;
import com.tencent.qcloud.tuikit.tuibarrage.presenter.TUIBarragePresenter;

/**
 * 弹幕发送界面
 */
public class TUIBarrageSendView extends Dialog implements ITUIBarrageSendView {
    private static final String TAG = "TUIBarrageSendView";

    private final InputMethodManager   mInputMethodManager;
    private       ITUIBarragePresenter mPresenter;
    private       ITUIBarrageListener  mBarrageListener;
    private       String               mGroupId;

    private Context  mContext;
    private EditText mEditText;
    private Button   mBtnSend;
    private View     mLayoutOutSide;
    private View     mLayoutInputView;

    public TUIBarrageSendView(Context context, String groupId) {
        super(context, R.style.TUIBarrageInputDialog);
        setContentView(R.layout.tuibarrage_dialog_send);
        mGroupId = groupId;
        this.mContext = context;
        mInputMethodManager = (InputMethodManager) mContext.getSystemService(Context.INPUT_METHOD_SERVICE);
        initView();
        initListener();
        initPresenter();
    }

    private void initView() {
        mEditText = (EditText) findViewById(R.id.et_input_message);
        mEditText.setInputType(InputType.TYPE_CLASS_TEXT);
        //修改下划线颜色为透明
        mEditText.getBackground().setColorFilter(mContext.getResources().getColor(R.color.tuichorus_transparent),
                PorterDuff.Mode.CLEAR);
        mBtnSend = (Button) findViewById(R.id.btn_send);
        mLayoutOutSide = findViewById(R.id.ll_outside_view);
        mLayoutInputView = findViewById(R.id.ll_input_view);
    }

    private void initPresenter() {
        mPresenter = new TUIBarragePresenter(mContext, mGroupId);
    }

    private void initListener() {
        mBtnSend.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                String msg = mEditText.getText().toString().trim();
                if (!TextUtils.isEmpty(msg)) {
                    TUIBarrageModel model = createBarrageModel(msg);
                    sendBarrage(model);

                    mInputMethodManager.showSoftInput(mEditText, InputMethodManager.SHOW_FORCED);
                    mInputMethodManager.hideSoftInputFromWindow(mEditText.getWindowToken(), 0);
                    mEditText.setText("");
                    dismiss();
                } else {
                    Toast.makeText(mContext, R.string.tuibarrage_warning_not_empty, Toast.LENGTH_LONG).show();
                }
                mEditText.setText("");
            }
        });

        mEditText.setOnEditorActionListener(new TextView.OnEditorActionListener() {
            @Override
            public boolean onEditorAction(TextView v, int actionId, KeyEvent event) {
                switch (actionId) {
                    case KeyEvent.KEYCODE_ENDCALL:
                    case KeyEvent.KEYCODE_ENTER:
                        if (mEditText.getText().length() > 0) {
                            mInputMethodManager.hideSoftInputFromWindow(mEditText.getWindowToken(), 0);
                            dismiss();
                        } else {
                            Toast.makeText(mContext, R.string.tuibarrage_warning_not_empty, Toast.LENGTH_LONG).show();
                        }
                        return true;
                    case KeyEvent.KEYCODE_BACK:
                        dismiss();
                        return false;
                    default:
                        return false;
                }
            }
        });

        mLayoutOutSide.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (v.getId() != R.id.ll_input_view) {
                    dismiss();
                }
            }
        });
        mLayoutInputView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mInputMethodManager.hideSoftInputFromWindow(mEditText.getWindowToken(), 0);
                dismiss();
            }
        });
    }

    @Override
    public void onDetachedFromWindow() {
        if (mPresenter != null) {
            mPresenter.destroyPresenter();
        }
        super.onDetachedFromWindow();
    }

    public void setBarrageListener(ITUIBarrageListener barrageListener) {
        mBarrageListener = barrageListener;
    }

    @Override
    public void sendBarrage(TUIBarrageModel model) {
        if (model == null) {
            return;
        }

        if (mPresenter == null) {
            initPresenter();
        }

        mPresenter.sendBarrage(model, new TUIBarrageCallBack.BarrageSendCallBack() {
            @Override
            public void onSuccess(int code, String msg, TUIBarrageModel model) {
                if (mBarrageListener != null) {
                    mBarrageListener.onSuccess(code, msg, model);
                }
            }

            @Override
            public void onFailed(int code, String msg) {
                if (mBarrageListener != null) {
                    mBarrageListener.onFailed(code, msg);
                }
            }
        });
    }

    private TUIBarrageModel createBarrageModel(String message) {
        TUIBarrageModel model = new TUIBarrageModel();
        model.message = message;
        model.extInfo.put(TUIBarrageConstants.KEY_USER_ID, TUILogin.getUserId());
        model.extInfo.put(TUIBarrageConstants.KEY_USER_NAME, TUILogin.getNickName());
        model.extInfo.put(TUIBarrageConstants.KEY_USER_AVATAR, TUILogin.getFaceUrl());
        return model;
    }
}
