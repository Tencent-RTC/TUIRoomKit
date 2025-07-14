/**
 * Copy the virtual background images .
 */

const path = require('path');
const fs = require('fs');

const srcPath = path.resolve(
  __dirname,
  '../src/TUIRoom/core/components/AdvancedBeauty/BeautyConfig/BackgroundImages'
);

const dstPath = path.resolve(__dirname, '../images');

if(!fs.existsSync(dstPath)) {
  fs.mkdirSync(dstPath, { recursive: true });
}

copyFiles(srcPath, dstPath);

function copyFiles(srcPath, dstPath) {
  const files = fs.readdirSync(srcPath);
  files.forEach(file => {
    const srcFilePath = path.join(srcPath, file);
    const dstFilePath = path.join(dstPath, file);
    fs.copyFileSync(srcFilePath, dstFilePath);
  });
}
