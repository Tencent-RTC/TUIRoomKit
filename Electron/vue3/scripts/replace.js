const fs = require('fs');
const { resolve } = require('path');
const path = require('path');

const changeDirList = [
  'TUIRoom',
  'views'
];


function readDirRecur(changeDirList) {
  changeDirList.forEach((folder)=>{
    const dirSrc = path.join(__dirname, `../packages/renderer/src/${folder}`);
    readFile(readDir(dirSrc));
  } )
}

function readDir(dirSrc,result = []) {
  fs.readdirSync(dirSrc).forEach(src => {
    const currentDirSrc = resolve(path.join(dirSrc, src))
    const isDirectory = fs.lstatSync(currentDirSrc).isDirectory()
    if(isDirectory){
      readDir(currentDirSrc, result)
    } else {
      result.push(currentDirSrc)
    }
  })
  return result
}

function readFile(fileList) {
  fileList.forEach((fileSrc)=>{
      if(fileSrc.endsWith('.vue') || fileSrc.endsWith('.ts')) {
        replaceTargetFile(fileSrc)
    }
  })
}

// 遍历替换目标字符串
function replaceTargetFile(fileSrc) {
  const file = fs.readFileSync(fileSrc, 'utf8')
  const resultFile = file.replace(/from '\@tencentcloud\/tuiroom-engine-js';/gm, 'from \'@tencentcloud/tuiroom-engine-electron\';');
  fs.writeFileSync(fileSrc, resultFile,'utf8')
  console.log('替换成功');
}
readDirRecur(changeDirList)
