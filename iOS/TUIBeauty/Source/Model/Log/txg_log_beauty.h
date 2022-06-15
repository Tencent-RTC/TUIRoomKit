//
//  txg_log_beauty.h
//  Pods
//
//  Created by 林智 on 2020/11/13.
//

#ifndef txg_log_beauty_h
#define txg_log_beauty_h

#define TUIBeautyLog(fmt, ...) NSLog((@"TUIBeauty LOG:%s [Line %d] " fmt), __PRETTY_FUNCTION__, __LINE__, ##__VA_ARGS__)

#define LOGE(fmt, ...) \
    TUIBeautyLog(fmt, ##__VA_ARGS__)
#define LOGW(fmt, ...) \
    TUIBeautyLog(fmt, ##__VA_ARGS__)
#define LOGI(fmt, ...) \
    TUIBeautyLog(fmt, ##__VA_ARGS__)
#define LOGD(fmt, ...) \
    TUIBeautyLog(fmt, ##__VA_ARGS__)
#define LOGV(fmt, ...) \
    TUIBeautyLog(fmt, ##__VA_ARGS__)

#endif /* txg_log_beauty_h */
