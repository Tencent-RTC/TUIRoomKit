/* eslint-disable no-param-reassign */
// index.ts
import { createI18n } from 'vue-i18n';        // 引入vue-i18n组件
import { getLanguage } from '../utils/common';
// 引入同级目录下文件
const modules = import.meta.globEager('./*');

// 假设你还有其他目录下的语言文件 它的路径是 src/home/locales/lang/en-US.ts
// 那么你就可以 使用 :lower:（小写） :upper:（大写） 来引入文件
const viewModules = import.meta.globEager('../**/locales/[[:lower:]][[:lower:]]-[[:upper:]][[:upper:]].ts');

function getLangAll(): any {
  const message:any = {};
  getLangFiles(modules, message);
  getLangFiles(viewModules, message);
  return message;
}
/**
 * 获取所有语言文件
 * @param {Object} mList
 */
function getLangFiles(mList:any, msg:any) {
  // eslint-disable-next-line no-restricted-syntax
  for (const path in mList) {
    if (mList[path].default) {
      //  获取文件名
      const pathName = path.substr(path.lastIndexOf('/') + 1, 5);
      if (msg[pathName]) {
        msg[pathName] = {
          ...mList[pathName],
          ...mList[path].default,
        };
      } else {
        msg[pathName] = mList[path].default;
      }
    }
  }
}

// 注册i8n实例并引入语言文件
const i18n = createI18n({
  legacy: false,
  locale: getLanguage() || 'zh-CN',
  messages: getLangAll(),
});

export default i18n;
