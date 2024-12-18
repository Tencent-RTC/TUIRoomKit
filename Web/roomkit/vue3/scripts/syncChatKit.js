const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Create directory
  const directoryPath = './src/TUIRoom/components/Chat/ChatKit';
  if (!fs.existsSync(directoryPath)) {
    execSync(`mkdir -p ${directoryPath}`, {
      stdio: 'inherit',
    });
  }

  // Synchronize files
  const excludePattern =
    "{'node_modules','package.json','excluded-list.txt','debug'}";
  const command = `rsync -av --delete --exclude=${excludePattern} ./node_modules/@tencentcloud/chat-uikit-vue/ ${directoryPath}`;
  execSync(command, { stdio: 'inherit' });

  console.log('Operation completed successfully');
} catch (error) {
  console.error('Operation failed:', error.message);
}
