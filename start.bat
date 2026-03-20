@echo off
REM 匿名问答平台 Docker启动脚本（Windows版）

setlocal enabledelayedexpansion

echo ========================================
echo   匿名问答平台 - Anonymous Q^&A
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

REM 自动检测 docker compose (v2) 或 docker-compose (v1)
set DC=
docker compose version >nul 2>&1
if not errorlevel 1 (
    set DC=docker compose
) else (
    docker-compose --version >nul 2>&1
    if not errorlevel 1 (
        set DC=docker-compose
    ) else (
        echo 错误：未找到 docker compose 或 docker-compose。请安装 Docker Desktop 或 Docker Compose 插件。
        pause
        exit /b 1
    )
)
echo 使用命令：%DC%

REM 创建.env文件（如果不存在）
if not exist .env (
    echo 未找到 .env 文件，从 .env.example 复制...
    copy .env.example .env
    echo 请编辑 .env 文件修改 JWT_SECRET 等敏感配置后重新运行。
    pause
)

echo 正在构建应用镜像...
call %DC% build --no-cache
if errorlevel 1 (
    echo 镜像构建失败！
    pause
    exit /b 1
)

echo.
echo 正在启动容器...
call %DC% up -d
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
echo 访问地址：
echo   前端应用：http://localhost
echo   后端API：http://localhost:5000/api
echo.
echo 有用的命令：
echo   查看日志：%DC% logs -f
echo   停止应用：%DC% down
echo   重启应用：%DC% restart
echo.
echo ========================================
echo.
pause
