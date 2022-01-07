#ifndef __COMMON_TXIMAGEBUTTON_H__
#define __COMMON_TXIMAGEBUTTON_H__

#include <QWidget>
#include "ui_TXImageButton.h"

class TXImageButton : public QWidget {
    Q_OBJECT

public:
    TXImageButton(QWidget *parent = Q_NULLPTR);
    ~TXImageButton();

    void SetText(QString text);
    void SetButtonImage(QString image, QString hover_image = "", QString disabled_image = "");
    void SetButtonTextColor(QString sheet_color_normal, QString sheet_color_hover, QString sheet_color_checked);
    void SetOperateMenuVisible(bool visible);

    void SetChecked(bool checked = false);
    bool isChecked();
signals:
    void clicked(bool checked);
    void SignalSetClicked(bool checked=false);
protected:
    void showEvent(QShowEvent *event);
    void resizeEvent(QResizeEvent *event);
    bool eventFilter(QObject *watched, QEvent *event);
private:
    void SetImage(QString button_image);
    void SetTextColor(QString sheet_color="black");
private:
    Ui::TXImageButton ui;

    QString button_image_;
    QString button_hover_image_;
    QString button_checked_image_;
    QString sheet_color_normal_ = "white";
    QString sheet_color_hover_ = "#2F79FF";
    QString sheet_color_checked_ = "#2F79FF";

    bool checked_ = false;
};

#endif
