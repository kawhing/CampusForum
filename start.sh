#!/bin/bash

# 匿名问答平台 Docker启动脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  匿名问答平台 - Anonymous Q&A${NC}"
echo -e "${GREEN}  Docker 一键启动脚本${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查Docker是否已安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误：Docker 未安装。请先安装 Docker。${NC}"
    exit 1
fi

# 自动检测 docker compose (v2) 或 docker-compose (v1)
if docker compose version &> /dev/null 2>&1; then
    DC="docker compose"
elif command -v docker-compose &> /dev/null; then
    DC="docker-compose"
else
    echo -e "${RED}错误：未找到 docker compose 或 docker-compose。请安装 Docker Desktop 或 Docker Compose 插件。${NC}"
    exit 1
fi

echo -e "${GREEN}使用命令：${DC}${NC}"

# 创建.env文件（如果不存在）
if [ ! -f .env ]; then
    echo -e "${YELLOW}未找到 .env 文件，从 .env.example 复制...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}请编辑 .env 文件修改 JWT_SECRET 等敏感配置后重新运行。${NC}"
fi

echo -e "${YELLOW}提示：可选的 safety-model（轻量安全模型）默认未启用，避免自动下载大模型。${NC}"
echo -e "${YELLOW}如需启用，请在启动后执行：${DC} --profile safety up -d safety-model${NC}"

echo -e "${YELLOW}正在构建应用镜像...${NC}"
$DC build --no-cache

echo -e "${YELLOW}正在启动容器...${NC}"
$DC up -d

echo -e "${GREEN}容器启动成功！${NC}"
echo ""
echo -e "${GREEN}访问地址：${NC}"
echo "  前端应用：${YELLOW}http://localhost${NC}"
echo "  后端API：${YELLOW}http://localhost:5000/api${NC}"
echo ""
echo -e "${GREEN}有用的命令：${NC}"
echo "  查看日志：${YELLOW}${DC} logs -f${NC}"
echo "  停止应用：${YELLOW}${DC} down${NC}"
echo "  重启应用：${YELLOW}${DC} restart${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
