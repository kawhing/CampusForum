# 部署指南 & 分支说明

## 分支现状一览

| 分支名 | 状态 | 说明 |
|--------|------|------|
| `main` | ✅ **保留 — 主分支** | 包含完整的 Node.js 后端 + React 前端，是部署用的代码 |
| `copilot/check-current-branch-status` | ✅ **当前 PR #5**（合并后可删除） | 修复了 README 和 `.devcontainer/devcontainer.json` |
| `copilot/remove-unnecessary-files` | 🗑️ **可删除** | 已通过 PR #3 合并到 `main`，其额外的改动已被 PR #5 覆盖 |
| `copilot/merge-to-main` | 🗑️ **可删除** | 已通过 PR #4 合并到 `copilot/remove-unnecessary-files`，内容已过时 |
| `copilot/refactor-duplicated-code` | 🗑️ **可删除** | 已通过 PR #2 合并到 `main`，分支本身已过时 |

**结论：`main` 分支就是包含完整功能的分支，其他 `copilot/*` 分支都可以在 PR #5 合并后删除。**

---

## 如何删除废弃分支

### 方法一：在 GitHub 网页上删除

1. 打开 `https://github.com/kawhing/CampusForum/branches`
2. 找到以下分支，点击右侧的 🗑️ 图标逐一删除：
   - `copilot/remove-unnecessary-files`
   - `copilot/merge-to-main`
   - `copilot/refactor-duplicated-code`
   - `copilot/check-current-branch-status`（PR #5 合并后）

### 方法二：用 Git 命令行删除

```bash
# 删除远程废弃分支（PR 合并后执行）
git push origin --delete copilot/remove-unnecessary-files
git push origin --delete copilot/merge-to-main
git push origin --delete copilot/refactor-duplicated-code
git push origin --delete copilot/check-current-branch-status

# 同步本地分支列表
git fetch --prune
```

---

## 部署方式

### 方式一：Docker 一键启动（推荐）

适合服务器部署或本地快速体验，无需安装 Node.js / MongoDB。

#### Linux / macOS

```bash
# 克隆代码
git clone https://github.com/kawhing/CampusForum.git
cd CampusForum

# 一键启动（自动复制 .env、构建镜像、启动容器）
chmod +x start.sh
./start.sh
```

或使用 Make：

```bash
make start
```

#### Windows

双击 `start.bat`，或在 PowerShell / CMD 中运行：

```bat
start.bat
```

#### 启动后访问

| 地址 | 说明 |
|------|------|
| `http://localhost` | 前端页面 |
| `http://localhost:5000/api` | 后端 API |
| `mongodb://localhost:27017` | MongoDB（仅本地调试用） |

> 首次启动需要拉取镜像和构建，约需 2–5 分钟，请耐心等待。

---

### 方式二：手动 Docker Compose

```bash
# 1. 复制并编辑环境变量（必须修改 JWT_SECRET）
cp .env.example .env
# 用编辑器打开 .env，将 JWT_SECRET 改为随机字符串

# 2. 构建并启动
docker compose up -d

# 3. 查看状态
docker compose ps

# 4. 查看实时日志
docker compose logs -f

# 5. 停止
docker compose down
```

---

### 方式三：本地开发模式（不使用 Docker）

需要本地安装：Node.js 18+、npm 8+、MongoDB 6.0+。

```bash
# 1. 复制环境变量
cp .env.example .env
cp backend/.env.example backend/.env

# 2. 安装依赖
make install
# 等价于：cd backend && npm install && cd ../frontend && npm install

# 3. 启动 MongoDB（本地需手动启动）
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# 4. 运行前后端
make run
# 等价于：
#   后端（http://localhost:5000）：cd backend && npm start
#   前端（http://localhost:3000）：cd frontend && npm start
```

---

## 常用运维命令

```bash
# 查看所有容器状态
docker compose ps

# 查看后端日志
docker compose logs -f backend

# 查看前端日志
docker compose logs -f frontend

# 查看数据库日志
docker compose logs -f mongodb

# 重启某个服务
docker compose restart backend

# 停止并删除容器（保留数据库数据卷）
docker compose down

# 停止并删除容器及所有数据（慎用！）
docker compose down -v

# 进入 MongoDB 调试
docker compose exec mongodb mongosh anon-qa

# 重新构建镜像（代码更新后）
docker compose build --no-cache
docker compose up -d
```

---

## 环境变量说明

编辑项目根目录的 `.env` 文件（从 `.env.example` 复制而来）：

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `MONGODB_URI` | `mongodb://mongodb:27017/anon-qa` | MongoDB 连接地址 |
| `JWT_SECRET` | `change_this_secret_in_production` | **⚠️ 生产环境必须修改** |
| `JWT_EXPIRES_IN` | `7d` | Token 有效期 |
| `PORT` | `5000` | 后端服务端口 |
| `NODE_ENV` | `production` | 运行环境 |

---

## 故障排查

### 端口被占用

```bash
# 查看占用 80 端口的进程
lsof -i :80
# 或修改 docker-compose.yml 中的端口映射，例如改成 "8080:80"
```

### MongoDB 连接失败

```bash
docker compose logs mongodb
# 等待 10-15 秒让 MongoDB 完全初始化后再访问
```

### 前端无法访问后端 API

检查 `docker-compose.yml` 中 `frontend` 服务的 Nginx 反向代理配置是否正确，确保 `/api` 请求被转发到 `http://backend:5000`。

### 镜像构建失败

```bash
# 清理缓存后重新构建
docker compose down
docker system prune -f
docker compose build --no-cache
docker compose up -d
```
