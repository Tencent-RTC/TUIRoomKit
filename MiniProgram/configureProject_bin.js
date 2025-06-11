#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const inquirerModule = import('inquirer');
const jsoncParser = require('jsonc-parser');

// 创建目录的函数
function createDirIfNotExist(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, {
      recursive: true,
    });
  }
}

// 复制目录的函数
function copyDir(src, dest) {
  createDirIfNotExist(dest);
  const entries = fs.readdirSync(src, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function appendStylesToFile(filePath, styles) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const newContent = `${fileContent}\n<style>\n${styles}\n</style>`;
  fs.writeFileSync(filePath, newContent, 'utf8');
}
class InitProject {
  destBase = process.cwd();
  sourceBase = __dirname;
  answers = {};
  srcPath = '';
  init(answers) {
    const { creationMethod } = answers;
    this.answers = answers;
    this.srcPath =
      creationMethod === 'CLI'
        ? path.join(this.destBase, './src')
        : this.destBase;
  }

  async run() {
    const { setManifestJSON, setPagesJSON } =
      await this.askForProjectCreationMethod(); // CLI or HBuilderX
    this.copyFile();
    setManifestJSON && this.setManifest();
    setPagesJSON && this.setPages();
    this.addStyleToApp();
  }
  async askForProjectCreationMethod() {
    console.log(
      '配置相关说明，请参考：https://cloud.tencent.com/document/product/647/97754#2.2-.E9.A1.B9.E7.9B.AE.E9.85.8D.E7.BD.AE.E6.9B.B4.E6.94.B9'
    );
    const questions = [
      {
        type: 'list',
        name: 'creationMethod',
        message: '请选择当前项目的创建方式:',
        choices: ['HBuilderX', 'CLI'],
        default: 'HBuilderX',
      },
      {
        type: 'confirm',
        name: 'createViteConfig',
        message:
          '是否创建vite.config.ts文件（若已存在该配置文件，请根据文档描述手动进行修改）?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'createTsConfig',
        message:
          '是否创建tsconfig.json文件（若已存在该配置文件，请根据文档描述手动进行修改）?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'setManifestJSON',
        message:
          '是否自动配置mainfest.json文件（若选择否，请根据文档描述手动进行修改）?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'setPagesJSON',
        message:
          '是否自动配置pages.json文件（若选择否，请根据文档描述手动进行修改）?',
        default: true,
      },
    ];
    // 等待 inquirer 导入完成
    const inquirer = await inquirerModule;
    const answers = await inquirer.default.prompt(questions);
    this.init(answers);
    return answers;
  }

  copyFile() {
    const { creationMethod, createViteConfig, createTsConfig } = this.answers;

    ['roomkit'].forEach(dir => {
      copyDir(
        path.join(this.sourceBase, './src', dir),
        path.join(this.srcPath, dir)
      );
    });

    // Copy wxmini_dev.sh and wxmini_prod.sh files
    ['wxmini_dev.sh', 'wxmini_prod.sh'].forEach(file => {
      fs.copyFileSync(
        path.join(this.sourceBase, file),
        path.join(this.destBase, file)
      );
    });

    // Copy RTCRoomEngine.wasm.br file
    const wasmDest = './static/RTCRoomEngine.wasm.br';
    createDirIfNotExist(path.dirname(wasmDest));
    fs.copyFileSync(
      './node_modules/@tencentcloud/tuiroom-engine-wx/RTCRoomEngine.wasm.br',
      path.join(this.srcPath, wasmDest)
    );

    fs.copyFileSync(
      path.join(this.sourceBase, 'src/pages/index.vue'),
      path.join(this.srcPath, 'pages/roomkitTest.vue')
    );

    if (createViteConfig) {
      fs.copyFileSync(
        path.join(
          this.sourceBase,
          creationMethod === 'CLI'
            ? './vite.config.ts'
            : 'vite.config_HBuliderX.ts'
        ),
        path.join(this.destBase, 'vite.config.ts')
      );
    }

    if (createTsConfig) {
      fs.copyFileSync(
        path.join(
          this.sourceBase,
          creationMethod === 'CLI' ? 'tsconfig.json' : 'tsconfig_HBuliderX.json'
        ),
        path.join(this.destBase, 'tsconfig.json')
      );
    }
  }

  // manifest.json 配置修改
  setManifest() {
    const manifestPath = path.join(this.srcPath, 'manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    // 使用 jsonc-parser 来解析带有注释的 JSON
    const manifest = jsoncParser.parse(manifestContent);

    const oldConfig = manifest['mp-weixin'];
    // 新增的配置
    const newConfig = {
      setting: {
        urlCheck: false,
        packNpmManually: true,
        packNpmRelationList: [
          ...(oldConfig?.setting?.packNpmRelationList || []),
          ...(oldConfig?.setting?.packNpmRelationList &&
          oldConfig?.setting?.packNpmRelationList[
            oldConfig?.setting?.packNpmRelationList.length - 1
          ]?.packageJsonPath === './roomkit/package.json'
            ? []
            : [
                {
                  packageJsonPath: './package.json',
                  miniprogramNpmDistDir: './',
                },
                {
                  packageJsonPath: './roomkit/package.json',
                  miniprogramNpmDistDir: './roomkit',
                },
              ]),
        ],
      },
      usingComponents: true,
      optimization: {
        ...(oldConfig?.optimization || {}),
        subPackages: true,
      },
    };

    // 合并配置
    manifest['mp-weixin'] = Object.assign({}, oldConfig, newConfig);

    const edits = jsoncParser.modify(
      manifestContent,
      ['mp-weixin'],
      manifest['mp-weixin'],
      { formattingOptions: { insertSpaces: true, tabSize: 2 } }
    );
    const newContent = jsoncParser.applyEdits(manifestContent, edits);

    // 写回manifest.json文件
    fs.writeFileSync(manifestPath, newContent, 'utf8');
  }

  // pages.json 配置修改
  setPages() {
    const pagesPath = path.join(this.srcPath, 'pages.json');
    const pagesContent = fs.readFileSync(pagesPath, 'utf8');
    // 使用 jsonc-parser 来解析带有注释的 JSON
    const pages = jsoncParser.parse(pagesContent);

    // 新增的配置
    const newConfig = {
      // pages数组中第一项表示应用启动页，参考：https://uniapp.dcloud.io/collocation/pages
      pages: [
        pages?.pages[0]?.path !== 'pages/roomkitTest'
          ? {
              path: 'pages/roomkitTest',
              style: {
                navigationBarTitleText: '',
              },
            }
          : null,
        ...(pages?.pages || []),
      ].filter(Boolean),
      subpackages: [
        ...((pages?.subpackages && pages.subpackages[0]?.root !== 'roomkit') ||
          []),
        {
          root: 'roomkit',
          pages: [
            {
              path: 'pages/home',
              style: {
                navigationBarTitleText: 'home',
              },
            },
            {
              path: 'pages/room',
              style: {
                navigationBarTitleText: 'room',
              },
            },
          ],
        },
      ],
      globalStyle: {
        ...(pages?.globalStyle || {}),
        usingComponents: {
          ...(pages?.globalStyle?.usingComponents || {}),
          'trtc-pusher': '@tencentcloud/trtc-component-wx/trtc-pusher',
          'trtc-player': '@tencentcloud/trtc-component-wx/trtc-player',
        },
      },
    };

    // 合并配置
    const newPages = Object.assign({}, pages, newConfig);

    const edits = jsoncParser.modify(pagesContent, [], newPages, {
      formattingOptions: { insertSpaces: true, tabSize: 2 },
    });
    const newContent = jsoncParser.applyEdits(pagesContent, edits);

    // 写回 pages.json文件
    fs.writeFileSync(pagesPath, newContent, 'utf8');
  }

  addStyleToApp() {
    const styles = `
    page{
      height: 100%;
      box-sizing: border-box;
    }
    
    view,label{
      box-sizing: border-box;
    }
    `;
    appendStylesToFile(path.join(this.srcPath, 'App.vue'), styles);
  }
}

const init = () => {
  const initProject = new InitProject();
  initProject.run();
};

init();
