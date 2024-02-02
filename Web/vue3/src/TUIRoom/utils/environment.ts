
export const isElectron = navigator.userAgent?.toLowerCase().indexOf(' electron/') > -1;
declare let wx: any;
export const isWeChat = (typeof wx !== 'undefined' && typeof wx.getSystemInfoSync === 'function' && Boolean(wx.getSystemInfoSync().fontSizeSetting));
export const isMobile = window?.matchMedia('(max-width: 600px)').matches || isWeChat;
export const isH5 = isMobile && !isWeChat;


// 微信浏览器
export const isWeiXinBrowser = navigator && navigator.userAgent?.toLocaleLowerCase().indexOf('micromessenger') > -1;
