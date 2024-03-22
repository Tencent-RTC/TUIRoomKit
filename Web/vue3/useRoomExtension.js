const fs = require('fs');
const path = require('path');
const readline = require('readline');
class UseRoomExtension {
  sourcePath = path.join(__dirname, './src/TUIRoom');
  projectPath = process.cwd();
  matchStrings = ['import TUIRoomKit', '<TUIRoomKit', 'app.use(RoomVueI18n)', 'import RoomVueI18n', '/message-room/message-room.vue', '/message-room/message-room-default.vue', `import { createPinia } from 'pinia';`, `app.use(createPinia());`];
  init() {
    const targetPath = findDirPath(this.projectPath, 'TUIKit', ['dist', 'node_modules'])
    copyDir(this.sourcePath, path.join(targetPath, './TUIRoom'));
    this.changeLine(path.join(this.projectPath, './src'));
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
      line = line.replace(/import MessageRoom from '.\/message-room\/message-room-default.vue';/, `// import MessageRoom from './message-room/message-room-default.vue';`)
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
function findDirPath(dir, dirname, skipDirs = []) {
  // 读取目录内容
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);

    // 检查文件是目录还是文件
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 跳过 skipDirs 数组中包含的文件夹
      if (skipDirs.includes(file)) {
        continue;
      }

      if (file === dirname) {
        console.log(`${dirname} folder found at:`, fullPath);
        return fullPath;
      } else {
        // 否则，递归遍历子目录
        const result = findDirPath(fullPath, dirname, skipDirs);
        if (result) {
          return result;
        }
      }
    }
  }

  // 如果在当前目录和子目录中未找到指定文件夹，返回 null
  return null;
}


