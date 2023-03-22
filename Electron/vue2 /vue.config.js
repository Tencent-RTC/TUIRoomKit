const os = require('os');
const targetPlatform = (function(){
     let target = os.platform();
     for (let i=0; i<process.argv.length; i++) {
         if (process.argv[i].includes('--target_platform=')) {
             target = process.argv[i].replace('--target_platform=', '');
             break;
         }
     }
     if (!['win32', 'darwin'].includes) target = os.platform();
     return target;
})();


function getArgvToObject() {
  let cmdArgvs = process.argv;
  let param = {};
  let key = '';
  let tmp = [];
  for (let i = 0 ; i<cmdArgvs.length; i++) {
    if (/^--[\w\d_-]+/g.test(cmdArgvs[i])){
      tmp = cmdArgvs[i].replace('--', '').split('=');
      key = tmp[0].toUpperCase();
      param[key] = tmp[1];
    }
  }
  console.log('getArgvToObject param: ', param);
  return param
}

let param = getArgvToObject();

if (!param.TRTC_ENV) {
  param.TRTC_ENV = 'development'
}

if ( !param.TRTC_ENV || !['production', 'development'].includes(param.TRTC_ENV)) {
  console.log('TRTC_ENV set default: development');
  param.TRTC_ENV = 'development'
}

if (!param.TARGET_PLATFORM || !['darwin', 'win32'].includes(param.TARGET_PLATFORM)) {
  console.log(`TARGET_PLATFORM set default: ${os.platform()}`);
  param.TARGET_PLATFORM = os.platform();
}

console.log('param:', param);

let vueCliConfig = {
  publicPath: './',
  configureWebpack: {
    devtool: 'source-map',
    target: 'electron-renderer',
    module: {
      rules: [
        {
          test: /\.node$/,
          loader: 'native-ext-loader',
          options: {
            rewritePath: 
            param.TRTC_ENV === 'development' 
              ? './node_modules/trtc-electron-sdk/build/Release' 
              : (targetPlatform === 'win32' ? './resources' : '../Resources')
            // 针对开发环境
            // rewritePath: './node_modules/trtc-electron-sdk/build/Release'
 
          }
        }
      ],
    },
    // plugins: [
    //   new StringReplaceWebpackPlugin(),
    // ],
    node: false,
  }
}

module.exports = vueCliConfig;