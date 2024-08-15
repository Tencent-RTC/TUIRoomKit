# 腾讯云 · 多人音视频房间解决方案（Web）

简体中文 | [English](README.md)

## 产品介绍

TUIRoomKit Web 端支持音视频通信、屏幕共享、成员管理、禁言禁画、聊天弹幕等功能，兼容主流的 PC 端和移动端浏览器，为企业会议、在线教育、互联网医疗和网络沙龙等场景提供了可快速部署的含 UI 解决方案。

当前目录包含 TUIRoomKit Web 端源码和快速跑通示例。如您需要将 TUIRoomKit 集成到已有业务中，请参考 [TUIRoomKIt 多人会议快速接入](https://cloud.tencent.com/document/product/647/81962)。

TUIRoomKit 版本更新日志请查看 [发布日志（TUIRoomKit)](https://cloud.tencent.com/document/product/647/90288)。

## 浏览器支持

TUIRoomKit 支持主流的 PC 及移动端浏览器，具体信息请参考 [浏览器支持](https://cloud.tencent.com/document/product/647/17249#.E6.94.AF.E6.8C.81.E7.9A.84.E5.B9.B3.E5.8F.B0)。

| [<img src="https://web.sdk.qcloud.com/trtc/webrtc/assets/logo/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Chrome | [<img src="https://web.sdk.qcloud.com/trtc/webrtc/assets/logo/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/> Edge | [<img src="https://web.sdk.qcloud.com/trtc/webrtc/assets/logo/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Firefox | [<img src="https://web.sdk.qcloud.com/trtc/webrtc/assets/logo/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Safari | [<img src="https://web.sdk.qcloud.com/trtc/webrtc/assets/logo/safari-ios_48x48.png" alt="iOS Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>iOS Safari | [<img src="https://web.sdk.qcloud.com/trtc/webrtc/assets/logo/opera_48x48.png" alt="Opera" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Opera |
| --------- | --------- | --------- | --------- | --------- | --------- |
| 56+ | 80+ | 56+ | 11+ | 11+ | 46+ |

## 目录说明

```
.
├── README.md
├── README.zh.md
├── example                 -- TUIRoomKit 示例 Demo，您可以快速下载运行
│   ├── vite-vue3-ts        -- TUIRoomKit 示例 Demo (Vite + vue3 + ts)
│   └── webpack-vue2.7-ts   -- TUIRoomKit 示例 Demo (Webpack + vue2.7 + ts)
└── roomkit                 -- TUIRoomKit 源码，可根据需求任意修改代码
    ├── vue2                -- TUIRoomKit vue2 源码
    └── vue3                -- TUIRoomKit vue3 源码
```

## 交流&反馈

如果您在使用过程中有遇到什么问题，欢迎提交 [**issue**](https://github.com/Tencent-RTC/TUIRoomKit/issues)，或者访问 [腾讯云通信官方社群](https://zhiliao.qq.com/s/cWSPGIIM62CC/cFUPGIIM62CF) 进行咨询和反馈。
