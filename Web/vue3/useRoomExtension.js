const fs = require('fs');
const path = require('path');
const readline = require('readline');
class UseRoomExtension {
  sourcePath = path.join(__dirname, './src/TUIRoom');
  targetPath = path.join(process.cwd(), './src/TUIRoom');
  currentPath = process.cwd();
  matchStrings = ['@tencentcloud/room-uikit-vue', '<TUIRoomKit', 'app.use(RoomVueI18n)', '<RoomMessageCard'];
  init() {
    copyDir(this.sourcePath, this.targetPath);
    this.changeLine(path.join(this.currentPath, './src'));
  }
  changeLine(dirPath) {
    processDirectory(dirPath, (filePath) => {
      changeLine(filePath, filePath, this.matchStrings);
    });
  }
}

const useRoomExtension = new UseRoomExtension();
useRoomExtension.init();

// utils
function changeLine(inputFile, outputFile, matchStrings) {
  let foundMatch = false;
  const tempFile = `${outputFile}.tmp`;

  const readInterface = readline.createInterface({
    input: fs.createReadStream(inputFile),
    output: fs.createWriteStream(tempFile),
    console: false,
  });

  readInterface.on('line', (line) => {
    const needReplace = matchStrings.some(ms => line.includes(ms));
    if (needReplace) {
      // 取消注释
      line = line.replace(/\/\/\s*/, '');
      line = line.replace(/<!--\s*/, '').replace(/\s*-->/, '');
      // 修改引用路径
      line = line.replace('@tencentcloud/room-uikit-vue/src', '@src');
      foundMatch = true;
    }
    readInterface.output.write(`${line}\n`);
  });

  readInterface.on('close', () => {
    if (foundMatch) {
      fs.rename(tempFile, outputFile, (err) => {
        if (err) {
          console.error(`Unable to rename temporary file:${err.message}`);
          return;
        }
        console.log(`Introduce room for file ${inputFile}`);
      });
    } else {
      fs.unlink(tempFile, (err) => {
        if (err) {
          console.error(`Unable to delete temporary files:${err.message}`);
          return;
        }
      });
    }
  });
}
function processDirectory(directoryPath, callback) {
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error(`无法读取文件夹：${err.message}`);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(directoryPath, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`无法获取文件信息：${err.message}`);
          return;
        }

        if (stats.isDirectory()) {
          processDirectory(filePath, callback);
        } else {
          callback(filePath);
        }
      });
    });
  });
}
function createDirIfNotExist(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, {
      recursive: true,
    });
  }
}
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


