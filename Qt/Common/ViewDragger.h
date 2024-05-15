#ifndef __VIEW_DRAGGER_H__
#define __VIEW_DRAGGER_H__
#include <QWidget>
#include <QMouseEvent>

class ViewDragger
{
public:
	ViewDragger(QWidget* parent);
	~ViewDragger();
	void mouseMove(QMouseEvent* event);
	void mousePress(QMouseEvent* event);
	void mouseRelease(QMouseEvent* event);
    void mouseDoubleClick(QMouseEvent* event);
private:
	bool is_pressed_;
	QPoint last_pos_;
	QWidget* bind_widget_;
};

#endif
