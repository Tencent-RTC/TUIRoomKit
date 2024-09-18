const fs = require('fs');
const path = require('path');
const readline = require('readline');
class UseRoomExtension {
  projectPath = process.cwd();
  matchStrings = [
    'import ConferenceMainView',
    '<ConferenceMainView',
    '/message-room/message-room.vue',
    '/message-room/message-room-default.vue',
    "import { createPinia } from 'pinia';",
    'app.use(createPinia());',
  ];
  init() {
    this.changeLine(path.join(this.projectPath, './src'));
  }
  changeLine(dirPath) {
    processDirectory(dirPath, filePath => {
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

  readInterface.on('line', line => {
    const needReplace = matchStrings.some(ms => line.includes(ms));
    if (needReplace) {
      line = line.replace(/\/\/\s*/, '');
      line = line.replace(/<!--\s*/, '').replace(/\s*-->/, '');
      line = line.replace(
        /import MessageRoom from '.\/message-room\/message-room-default.vue';/,
        "// import MessageRoom from './message-room/message-room-default.vue';"
      );
      foundMatch = true;
    }
    readInterface.output.write(`${line}\n`);
  });

  readInterface.on('close', () => {
    if (foundMatch) {
      fs.rename(tempFile, outputFile, err => {
        if (err) {
          console.error(`Unable to rename temporary file:${err.message}`);
          return;
        }
        console.log(`Introduce room for file ${inputFile}`);
      });
    } else {
      fs.unlink(tempFile, err => {
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
      console.error(`Unable to read folder:${err.message}`);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(directoryPath, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Unable to get file information:${err.message}`);
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
