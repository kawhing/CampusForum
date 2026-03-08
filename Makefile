# Makefile - 项目快速命令

.PHONY: help build run stop logs clean test install docker-build docker-up docker-down

help:
	@echo "校园论坛 (CampusForum) - 快速命令"
	@echo ""
	@echo "使用方法: make [命令]"
	@echo ""
	@echo "可用命令:"
	@echo "  make install          - 安装依赖（Maven）"
	@echo "  make build            - 编译项目"
	@echo "  make test             - 运行测试"
	@echo "  make run              - 本地运行应用"
	@echo "  make clean            - 清理构建文件"
	@echo ""
	@echo "  make docker-build     - 构建Docker镜像"
	@echo "  make docker-up        - 启动Docker容器"
	@echo "  make docker-down      - 停止Docker容器"
	@echo "  make docker-logs      - 查看Docker日志"
	@echo "  make docker-ps        - 查看运行中的容器"
	@echo ""
	@echo "  make db-init          - 初始化数据库"
	@echo "  make db-connect       - 连接到数据库"
	@echo ""

install:
	mvn clean install -DskipTests

build:
	mvn clean package -DskipTests

test:
	mvn test

run:
	mvn spring-boot:run

clean:
	mvn clean
	rm -rf uploads/ logs/

docker-build:
	docker-compose build --no-cache

docker-up:
	docker-compose up -d
	@echo "应用启动中，请等待10-15秒..."
	@sleep 5
	@echo "访问 http://localhost:8080 (管理员: admin/admin123)"

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f app

docker-ps:
	docker-compose ps

db-init:
	docker-compose exec db mysql -u root -proot campus_forum < src/main/resources/db/init.sql

db-connect:
	docker-compose exec db mysql -u root -proot campus_forum

# 一键启动（完整流程）
start: build docker-build docker-up
	@echo "校园论坛已启动！访问 http://localhost:8080"

# 一键停止
stop: docker-down
	@echo "校园论坛已停止"

# 重启
restart: docker-down docker-up
	@echo "校园论坛已重启"

# 查看所有容器状态
status:
	@echo "Container Status:"
	docker-compose ps
	@echo ""
	@echo "Network Status:"
	docker network ls | grep campusforum

# 清理所有Docker资源
docker-clean:
	docker-compose down -v
	@echo "已清理所有Docker资源"
