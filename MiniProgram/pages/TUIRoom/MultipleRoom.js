Page({
  data: {
    itemList: [
      {
        title: '创建房间',
        iconUrl: 'https://qcloudimg.tencent-cloud.cn/raw/d2cbb18b39c996cac054226be289c037.svg',
        navigateTo: 'creat-room/createRoom',
      },
      {
        title: '加入房间',
        iconUrl: 'https://qcloudimg.tencent-cloud.cn/raw/d9e4266b7fb58d55d5dee5744920a59b.svg',
        navigateTo: 'join-room/joinRoom',
      },
    ],
  },
  onLoad(options) {},
  entryTap(e) {
    const { url } = e.currentTarget.dataset;
    console.log(url);
    wx.navigateTo({ url });
  },
  onShareAppMessage() {
    return {
      path: 'pages/home/home',
      title: '腾讯视频云',
      imageUrl: 'https://qcloudimg.tencent-cloud.cn/raw/7955e99fa5c8f1badbab50ef87c935cf.png',
    };
  },
});
