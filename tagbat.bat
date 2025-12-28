@echo off
chcp 65001 >nul
set /p TAG_NAME="请输入版本号 (例如 v1.0.0): "

if "%TAG_NAME%"=="" goto error

echo.
echo 正在处理版本: %TAG_NAME% ...
echo ------------------------------

:: 1. 删除本地
git tag -d %TAG_NAME% 2>nul

:: 2. 删除远程
echo 正在尝试删除远程旧标签 (如果存在)...
git push origin :refs/tags/%TAG_NAME% 2>nul

:: 3. 提交
echo 正在提交代码...
git add .
git commit -m "release: %TAG_NAME%"

:: 4. 重新打标
echo 正在创建新标签...
git tag %TAG_NAME%

:: 5. 推送
echo 正在推送到远程...
git push origin %TAG_NAME%

echo.
echo 成功！GitHub 构建应该开始了。
pause
exit

:error
echo 错误：未输入版本号。
pause