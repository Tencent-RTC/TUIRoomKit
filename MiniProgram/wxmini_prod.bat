@echo off
if exist "dist\build\mp-weixin" (
  cd dist\build\mp-weixin
) else if exist "unpackage\dist\build\mp-weixin" (
  cd unpackage\dist\build\mp-weixin
) else (
  echo Neither "dist\build\mp-weixin" nor "unpackage\dist\build\mp-weixin" directories exist.
  exit /b 1
)

npm init -y && npm i @tencentcloud/trtc-component-wx && cd roomkit && npm init -y && npm i @tencentcloud/tuiroom-engine-wx@2.6.3