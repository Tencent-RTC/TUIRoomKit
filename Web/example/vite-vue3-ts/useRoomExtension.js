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
      // Uncomment
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
      console.error(`Unable to read folder：${err.message}`);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(directoryPath, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Unable to get folder：${err.message}`);
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
  // Read the contents of the catalogue
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);

    // Checking whether a file is a directory or a file
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip folders contained in the skipDirs array
      if (skipDirs.includes(file)) {
        continue;
      }

      if (file === dirname) {
        console.log(`${dirname} folder found at:`, fullPath);
        return fullPath;
      } else {
        // Otherwise, recursively traverse the subdirectories
        const result = findDirPath(fullPath, dirname, skipDirs);
        if (result) {
          return result;
        }
      }
    }
  }

  // Returns null if the specified folder is not found in the current directory or subdirectories.
  return null;
}


