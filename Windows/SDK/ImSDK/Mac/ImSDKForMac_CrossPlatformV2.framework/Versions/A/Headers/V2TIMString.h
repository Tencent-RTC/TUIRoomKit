// Copyright (c) 2021 Tencent. All rights reserved.

#ifndef __V2TIM_STRING_H__
#define __V2TIM_STRING_H__

#include "V2TIMDefine.h"

#include <cstddef>

class V2TIMStringIMPL;

class TIM_API V2TIMString {
public:
    V2TIMString();

    V2TIMString(const char *pStr);

    V2TIMString(const char *pStr, size_t size);

    V2TIMString(const V2TIMString &str);

    virtual ~V2TIMString();

    V2TIMString &operator=(const V2TIMString &str);

    V2TIMString &operator=(const char *pStr);

    bool operator==(const V2TIMString &str) const;

    bool operator!=(const V2TIMString &str) const;

    bool operator<(const V2TIMString &str) const;

    char &operator[](int index);

    size_t Size() const;

    size_t Length() const;

    bool Empty() const;

    const char *CString() const;

private:
    V2TIMStringIMPL *impl_;
};

#endif /* __V2TIM_STRING_H__ */
