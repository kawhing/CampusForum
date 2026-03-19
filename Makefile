# Makefile - 项目快速命令

.PHONY: help build run stop logs clean test install docker-build docker-up docker-down

# 自动检测 docker compose (v2) 或 docker-compose (v1)
DC := $(shell docker compose version > /dev/null 2>&1 && echo "docker compose" || echo "docker-compose")

help:
	@echo "匿名问答平台 (Anonymous Q&A) - 快速命令"
	@echo ""
	@echo "使用方法: make [命令]"
	@echo ""
	@echo "可用命令:"
	@echo "  make install          - 安装依赖（前后端）"
	@echo "  make build            - 编译前端"
	@echo "  make test             - 运行前端测试"
	@echo "  make run              - 本地运行（需先安装依赖）"
	@echo "  make clean            - 清理构建文件"
	@echo ""
	@echo "  make docker-build     - 构建Docker镜像"
	@echo "  make docker-up        - 启动Docker容器"
	@echo "  make docker-down      - 停止Docker容器"
	@echo "  make docker-logs      - 查看Docker日志"
	@echo "  make docker-ps        - 查看运行中的容器"
	@echo ""

install:
	cd backend && npm install
	cd frontend && npm install

build:
	cd frontend && npm run build

test:
	cd frontend && npm test -- --watchAll=false

run:
	@echo "启动后端..."
	cd backend && npm start &
	@echo "启动前端（开发模式）..."
	cd frontend && npm start

clean:
	rm -rf frontend/build
	rm -rf frontend/node_modules
	rm -rf backend/node_modules

docker-build:
	$(DC) build --no-cache

docker-up:
	@if [ ! -f .env ]; then cp .env.example .env; fi
	$(DC) up -d
	@echo "应用启动中，请等待..."
	@echo "前端访问：http://localhost"
	@echo "后端API：http://localhost:5000/api"

docker-down:
	$(DC) down

docker-logs:
	$(DC) logs -f

docker-ps:
	$(DC) ps

# 一键启动（完整Docker流程）
start: docker-build docker-up
	@echo "匿名问答平台已启动！访问 http://localhost"

# 一键停止
stop: docker-down
	@echo "已停止"

# 重启
restart: docker-down docker-up
	@echo "已重启"

# 查看所有容器状态
status:
	@echo "Container Status:"
	$(DC) ps

# 清理所有Docker资源（含数据卷）
docker-clean:
	$(DC) down -v
	@echo "已清理所有Docker资源"
