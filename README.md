# 校园论坛 (CampusForum)

一个功能完善、界面美观的校园匿名问答平台，帮助学校同学互相交流、分享知识、互相帮助。

## 🎯 项目特性

- **用户认证系统** - 注册、登录、个人资料管理
- **匿名问答** - 发布、回答、搜索问题
- **评论系统** - 支持层级回复
- **管理后台** - 用户管理、内容审核
- **响应式设计** - 完美适配桌面、平板、手机等各种设备
- **美观UI** - 基于Ant Design的现代化界面设计
- **Docker部署** - 一键启动，开箱即用
- **心理援助引导** - 检测轻生/高风险关键词时自动弹窗联系方式，提供 AI 心理辅导页面入口，并对含脏话内容降低信誉分以保护社区氛围

## 🛠️ 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **后端** | Node.js + Express | 18+ |
| **数据库** | MongoDB | 6.0 |
| **前端** | React | 18 |
| **UI框架** | Ant Design | 5 |
| **状态管理** | Redux Toolkit | 2 |
| **路由** | React Router | 6 |
| **容器化** | Docker & Docker Compose | 最新版 |

## 📋 系统要求

### 本地开发环境
- Node.js 18 或更高版本
- npm 8+
- MongoDB 6.0+

### Docker部署（推荐）
- Docker 20.0+
- Docker Compose 1.29+
- 2GB+ 可用内存
- 5GB+ 可用磁盘空间

#### Windows 10 Docker安装
1. 下载 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
2. 安装并重启计算机
3. 在PowerShell中验证：
   ```powershell
   docker --version
   docker compose version
   ```

> 📋 **完整部署指南（含分支说明）请查看 [DEPLOYMENT.md](DEPLOYMENT.md)**

## 🚀 快速启动

### 方式一：Docker一键启动（推荐，Windows/Mac/Linux）

#### Windows 10用户
```batch
# 双击运行启动脚本
start.bat
```

或在PowerShell/CMD中运行：
```powershell
docker compose up -d
```

#### Linux/Mac用户
```bash
# 给脚本执行权限
chmod +x start.sh

# 运行启动脚本
./start.sh
```

或直接用docker compose：
```bash
docker compose up -d
```

### 方式二：本地开发运行

#### 1. 配置环境变量
复制并修改环境变量文件：
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

#### 2. 安装依赖
```bash
make install
```

或分别安装：
```bash
cd backend && npm install
cd frontend && npm install
```

#### 3. 运行应用
```bash
make run
```

或分别运行：
```bash
# 后端（端口5000）
cd backend && npm start

# 前端（端口3000，开发模式）
cd frontend && npm start
```

## 📱 应用访问

### Docker部署后
- **前端地址**: http://localhost:80
- **后端API**: http://localhost:5000

等待15-20秒让数据库完全初始化后即可访问。

### 本地开发运行
- **前端地址**: http://localhost:3000
- **后端API**: http://localhost:5000

## 📚 API接口文档

### 认证相关
```
POST   /api/auth/register          - 用户注册
POST   /api/auth/login             - 用户登录
```

### 问题管理
```
POST   /api/questions              - 发布问题
GET    /api/questions              - 获取问题列表（分页）
GET    /api/questions/:id          - 获取问题详情
PUT    /api/questions/:id          - 编辑问题
DELETE /api/questions/:id          - 删除问题
GET    /api/questions/search       - 搜索问题
```

### 回答管理
```
POST   /api/questions/:id/answers  - 发表回答
GET    /api/questions/:id/answers  - 获取问题回答
PUT    /api/answers/:id            - 编辑回答
DELETE /api/answers/:id            - 删除回答
```

### 用户管理
```
GET    /api/users/:id              - 获取用户信息
PUT    /api/users/:id              - 更新用户信息
DELETE /api/users/:id              - 删除用户
```

### 管理员
```
GET    /api/admin/users            - 获取用户列表
PUT    /api/admin/users/:id/ban    - 封禁用户
GET    /api/admin/questions        - 获取问题列表
DELETE /api/admin/questions/:id    - 删除问题
```

## 🗂️ 项目结构

```
CampusForum/
├── backend/                          # Node.js后端
│   ├── src/
│   │   ├── app.js                    # 应用入口
│   │   ├── config/
│   │   │   └── db.js                 # 数据库配置
│   │   ├── controllers/              # 控制器
│   │   │   ├── authController.js
│   │   │   ├── questionController.js
│   │   │   ├── answerController.js
│   │   │   ├── userController.js
│   │   │   └── adminController.js
│   │   ├── middleware/               # 中间件
│   │   │   ├── auth.js
│   │   │   └── roles.js
│   │   ├── models/                   # 数据模型
│   │   │   ├── User.js
│   │   │   ├── Question.js
│   │   │   ├── Answer.js
│   │   │   └── Comment.js
│   │   └── routes/                   # 路由
│   │       ├── auth.js
│   │       ├── questions.js
│   │       ├── answers.js
│   │       ├── users.js
│   │       └── admin.js
│   ├── package.json
│   └── Dockerfile
├── frontend/                         # React前端
│   ├── src/
│   │   ├── App.js                    # 根组件
│   │   ├── index.js                  # 入口
│   │   ├── api/                      # API请求
│   │   ├── components/               # 公共组件
│   │   ├── pages/                    # 页面组件
│   │   └── store/                    # Redux状态
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml                # Docker Compose配置
├── start.sh                          # Linux/Mac启动脚本
├── start.bat                         # Windows启动脚本
├── Makefile                          # Make快速命令
├── .dockerignore                     # Docker忽略文件
├── .gitignore                        # Git忽略文件
├── .env.example                      # 环境变量示例
└── README.md                         # 项目说明文档
```

## 🛠️ 常用命令

### npm命令
```bash
# 安装依赖（前后端）
make install

# 运行前端测试
make test

# 编译前端
make build

# 本地运行
make run
```

### Docker命令
```bash
# 构建镜像
docker compose build

# 启动容器（后台运行）
docker compose up -d

# 停止容器
docker compose down

# 查看日志（实时）
docker compose logs -f backend

# 查看运行中的容器
docker compose ps

# 重启容器
docker compose restart

# 查看容器资源使用
docker stats
```

### Make命令（推荐）
```bash
# 查看所有可用命令
make help

# 安装依赖
make install

# 编译前端
make build

# 启动Docker（推荐）
make docker-up

# 停止Docker
make docker-down

# 查看日志
make docker-logs
```

## 🔑 默认管理员账户

后端首次启动时会自动检测数据库中是否存在管理员账户。如果不存在，则自动创建一个默认管理员账户：

| 字段 | 默认值 |
|------|--------|
| **邮箱** | `admin@campus.edu` |
| **密码** | `Admin123456` |
| **用户名** | `admin` |

> ⚠️ **请在生产环境部署后立即登录并修改管理员密码！**

可通过 `.env` 文件中的环境变量自定义管理员账户（必须在**首次**启动前设置）：

```env
ADMIN_EMAIL=your_admin@example.com
ADMIN_PASSWORD=YourSecurePassword123
ADMIN_USERNAME=youradmin
# 可选：是否在启动时同步管理员密码（默认 true，如需禁用设置为 false）
# ALLOW_ADMIN_PASSWORD_SYNC=true
# 可选：如果管理员被封禁，是否仍允许同步凭据（默认 false，仅紧急恢复时设置为 true）
# ALLOW_ADMIN_SYNC_WHEN_BLOCKED=false
```

> 提示：使用 Docker 部署时，`docker-compose.yml` 会将上述管理员相关环境变量（含可选同步开关）传递给后端容器，只需在根目录 `.env` 中设置即可生效。

> 提示：后端启动时会自动将已存在的管理员账户同步到上述环境变量配置（邮箱、用户名、密码），以确保能使用最新配置的管理员凭据登录。

密码规则：至少6位，必须包含字母和数字。

---

## 🗄️ 数据库访问

本项目默认使用**无密码认证**的 MongoDB（开发/单机部署场景）：

| 项目 | 值 |
|------|----|
| **连接地址** | `mongodb://localhost:27017` |
| **数据库名** | `anon-qa` |
| **认证** | 无（默认不设置用户名/密码） |

Docker 部署时，MongoDB 仅对内部 Docker 网络暴露，外部可通过 `localhost:27017` 访问（仅用于调试）。

> ⚠️ **生产环境**强烈建议启用 MongoDB 认证。在 `docker-compose.yml` 的 `mongodb` 服务中添加：
> ```yaml
> environment:
>   MONGO_INITDB_ROOT_USERNAME: admin
>   MONGO_INITDB_ROOT_PASSWORD: your_db_password
> ```
> 同时将 `MONGODB_URI` 更新为：
> ```
> MONGODB_URI=mongodb://admin:your_db_password@mongodb:27017/anon-qa?authSource=admin
> ```

---


### 环境变量
主要环境变量（`.env`）：
```env
# MongoDB配置
MONGODB_URI=mongodb://mongodb:27017/anon-qa

# JWT配置
JWT_SECRET=change_this_secret_in_production
JWT_EXPIRES_IN=7d

# 后端配置
PORT=5000
NODE_ENV=production
```

### 日志配置
后端日志通过 `morgan` 中间件输出，可在 `backend/src/app.js` 中调整日志级别。

## 🔐 安全说明

1. **密码加密** - 使用BCrypt算法加密存储
2. **JWT认证** - 使用JSON Web Token进行身份验证
3. **请求限流** - 全局限流200次/15分钟，认证接口限流20次/15分钟
4. **输入验证** - 使用express-validator进行参数校验

## 🐛 故障排除

### Docker启动后无法访问
1. 检查容器是否运行：`docker compose ps`
2. 查看日志：`docker compose logs backend`
3. 检查防火墙是否阻止80或5000端口
4. 确保没有其他应用占用端口

### 数据库连接失败
1. 检查MongoDB容器状态：`docker compose logs mongodb`
2. 等待数据库完全初始化（约10-15秒）
3. 验证连接：`docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"`

### 应用启动缓慢
1. Docker首次启动需要拉取镜像并初始化，耐心等待
2. 如使用虚拟化环境，确保分配足够的CPU和内存
3. 检查网络连接（某些依赖需要从网络下载）

## 📖 使用指南

### 注册新用户
1. 点击"注册"链接
2. 填写用户名、邮箱、密码
3. 点击"注册"按钮

### 发布问题
1. 登录账户
2. 点击"提问"按钮
3. 填写问题标题和内容
4. 点击"发布"

### 回答问题
1. 浏览或搜索问题
2. 点击问题进入详情页
3. 在回答框输入内容
4. 点击"提交回答"

## 🤝 贡献指南

欢迎提交Issue和Pull Request改进项目！

### 代码风格
- JavaScript代码遵循ESLint规范
- 使用2个空格缩进
- 变量名使用驼峰命名法

### 测试要求
- 新功能需附带单元测试
- 运行所有测试：`make test`

## 📝 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 📞 支持和联系

如有问题或建议，请：
1. 提交Issue
2. 查阅项目Wiki文档

## 🎓 学习资源

- [Node.js官方文档](https://nodejs.org/docs/)
- [Express官方文档](https://expressjs.com/)
- [React官方文档](https://react.dev/)
- [MongoDB官方文档](https://www.mongodb.com/docs/)
- [Ant Design官方文档](https://ant.design/docs/react/introduce)
- [Docker官方文档](https://docs.docker.com/)

## 🏆 致谢

感谢所有贡献者和用户的支持！

---

**最后更新**: 2026年3月19日  
**版本**: 1.0.0  
**维护者**: Campus Forum Team
