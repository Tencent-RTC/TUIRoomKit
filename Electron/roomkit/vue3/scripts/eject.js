/**
 * Copy the TUIRoomKit source code into the src/components/TUIRoom directory.
 * cd ${your_project}
 * node node_modules/@tencentcloud/roomkit-web-vue3/scripts/eject.js
 */

const path = require('path');
const fs = require('fs');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

const defaultTargetDir = './src/components/TUIRoom';

readline.question(
  `This script copies the TUIRoomKit source code to the ${defaultTargetDir} path, do you want to change the copy path? (y|n)`,
  answer => {
    if (
      answer.toLocaleLowerCase() === 'y' ||
      answer.toLocaleLowerCase() === 'yes'
    ) {
      readline.question('Please enter your copy path: ', targetDir => {
        copyTUIRoomKit(targetDir);
        readline.close();
      });
    } else {
      copyTUIRoomKit();
      readline.close();
    }
  }
);

function copyTUIRoomKit(targetDir) {
  if (!targetDir) {
    targetDir = defaultTargetDir;
  }
  const sourcePath = path.resolve(__dirname, '../src/TUIRoom');
  const targetPath = path.resolve(process.cwd(), targetDir);

  try {
    fs.accessSync(targetPath);
    errorLog(
      `${targetDir} path already exists, if you want to copy it, please delete the target path first or re-specify it!`
    );
    return;
  } catch (error) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
  copyExitsFolder(sourcePath, targetPath);
  successLog(
    `The TUIRoomKit source code has been successfully copied to the ${targetDir} path!`
  );
}

function copyExitsFolder(src, dest) {
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.statSync(srcPath).isDirectory()) {
      fs.mkdirSync(destPath);
      copyExitsFolder(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function errorLog(info) {
  console.log('\x1B[31m%s\x1B[0m', `【ERROR】${info}`);
}

function successLog(info) {
  console.log('\x1B[32m', `【SUCCESS】${info}`);
}
