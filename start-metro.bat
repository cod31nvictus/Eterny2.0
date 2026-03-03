@echo off
set ANDROID_HOME=C:\Users\Sadaf Siddiqui\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools
cd /d "C:\Users\Sadaf Siddiqui\projects\eterny2.0\apps\mobile"
npx expo start --dev-client
