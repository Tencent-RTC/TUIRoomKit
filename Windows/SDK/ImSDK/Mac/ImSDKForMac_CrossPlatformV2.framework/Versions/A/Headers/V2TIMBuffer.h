// Copyright (c) 2021 Tencent. All rights reserved.

#ifndef __V2TIM_BUFFER_H__
#define __V2TIM_BUFFER_H__

#include "V2TIMDefine.h"

#include <cstddef>

class TIM_API V2TIMBuffer {
public:
    V2TIMBuffer();

    V2TIMBuffer(const V2TIMBuffer &buffer);

    V2TIMBuffer(const uint8_t *data, size_t size);

    virtual ~V2TIMBuffer();

    const uint8_t *Data() const;

    size_t Size() const;

    V2TIMBuffer &operator=(const V2TIMBuffer &buffer);

private:
    uint8_t *buffer_;
    size_t length_;
};

#endif /* __V2TIM_BUFFER_H__ */
