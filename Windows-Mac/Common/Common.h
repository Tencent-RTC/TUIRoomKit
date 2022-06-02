#pragma once
#include <QFile>

enum class Language {
    kChinese = 0,
    kEnglish = 1
};

enum TXMessageType {
    kNoButton     =   0x0000,
    kOk           =   0x0001,
    kCancel       =   0x0010,
    kLeaveRoom    =   0x0100,
    kDestoryRoom  =   0x1000
};

#define LOAD_STYLE_SHEET(path) {\
	QString qss;\
	QFile qssFile(path);\
	qssFile.open(QFile::ReadOnly);\
	if (qssFile.isOpen())\
	{\
		qss = QLatin1String(qssFile.readAll());\
		this->setStyleSheet(qss);\
		qssFile.close();\
	}\
}

#define DELETE_OBJECT(obj) {\
    if (obj != nullptr) {\
        delete obj;\
        obj = nullptr;\
    }\
}
