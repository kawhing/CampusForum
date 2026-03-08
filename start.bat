@echo off
REM 校园论坛 Docker启动脚本（Windows版）

setlocal enabledelayedexpansion

echo ========================================
echo   校园论坛 - Campus Forum
echo   Docker 一键启动脚本 (Windows)
echo ========================================
echo.

REM 检查Docker是否已安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo 错误：Docker 未安装。请先安装 Docker Desktop for Windows。
    pause
    exit /b 1
)

REM 检查docker-compose是否已安装
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo 错误：docker-compose 未安装。
    pause
    exit /b 1
)

echo 正在构建应用镜像...
call docker-compose build --no-cache
if errorlevel 1 (
    echo 镜像构建失败！
    pause
    exit /b 1
)

echo.
echo 正在启动容器...
call docker-compose up -d
if errorlevel 1 (
    echo 容器启动失败！
    pause
    exit /b 1
)

echo.
echo ========================================
echo 容器启动成功！
echo ========================================
echo.
echo 应用接下来的步骤：
echo 1. 等待数据库初始化完成（约10-15秒）
echo 2. 访问应用：http://localhost:8080
echo 3. 默认用户：admin / admin123
echo.
echo 有用的命令：
echo - 查看日志：docker-compose logs -f app
echo - 停止应用：docker-compose down
echo - 重启应用：docker-compose restart
echo.
echo ========================================
echo.
pause
