@echo off
if exist "dist\dev\mp-weixin" (
  cd dist\dev\mp-weixin
) else if exist "unpackage\dist\dev\mp-weixin" (
  cd unpackage\dist\dev\mp-weixin
) else (
  echo Neither "dist\dev\mp-weixin" nor "unpackage\dist\dev\mp-weixin" directories exist.
  exit /b 1
)

npm init -y && npm i @tencentcloud/trtc-component-wx --no-package-lock && cd roomkit && npm init -y && npm i @tencentcloud/tuiroom-engine-wx@2.9.1 --no-package-lock && npm i @tencentcloud/chat --no-package-lock && npm i @tencentcloud/tui-core --no-package-lock
