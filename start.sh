#!/bin/bash

# 校园论坛 Docker启动脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  校园论坛 - Campus Forum${NC}"
echo -e "${GREEN}  Docker 一键启动脚本${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查Docker是否已安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误：Docker 未安装。请先安装 Docker。${NC}"
    exit 1
fi

# 检查docker-compose是否已安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}错误：docker-compose 未安装。请先安装 docker-compose。${NC}"
    exit 1
fi

echo -e "${YELLOW}正在构建应用镜像...${NC}"
docker-compose build --no-cache

echo -e "${YELLOW}正在启动容器...${NC}"
docker-compose up -d

echo -e "${GREEN}容器启动成功！${NC}"
echo ""
echo -e "${GREEN}应用接下来的步骤：${NC}"
echo "1. 等待数据库初始化完成（约10-15秒）"
echo "2. 访问应用：${YELLOW}http://localhost:8080${NC}"
echo "3. 默认用户：admin / admin123"
echo ""
echo -e "${GREEN}有用的命令：${NC}"
echo "- 查看日志：${YELLOW}docker-compose logs -f app${NC}"
echo "- 停止应用：${YELLOW}docker-compose down${NC}"
echo "- 重启应用：${YELLOW}docker-compose restart${NC}"
echo "- 进入数据库：${YELLOW}docker-compose exec db mysql -u root -proot campus_forum${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
