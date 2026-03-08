# 校园论坛 (CampusForum) 

一个功能完善、界面美观的校园在线论坛系统，帮助学校同学互相交流、分享资源、互相帮助。

## 🎯 项目特性

- **用户认证系统** - 注册、登录、个人资料管理
- **帖子管理** - 发布、编辑、删除、分类管理、搜索功能
- **评论系统** - 支持层级回复、实时更新
- **文件分享** - 支持上传/下载文件，单个文件不超过20MB
- **响应式设计** - 完美适配桌面、平板、手机等各种设备
- **美观UI** - 基于Bootstrap 5的现代化界面设计
- **Docker部署** - 一健启动，开箱即用

## 🛠️ 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **后端** | Spring Boot | 2.7.14 |
| **Web框架** | Spring Web MVC | - |
| **ORM** | Spring Data JPA | - |
| **数据库** | MySQL | 8.0 |
| **前端模板** | Thymeleaf | - |
| **UI框架** | Bootstrap | 5.1.3 |
| **JavaScript** | Vanilla JS (原生) | ES6+ |
| **构建工具** | Maven | 3.6+ |
| **容器化** | Docker & Docker Compose | 最新版 |

## 📋 系统要求

### 本地开发环境
- Java 11 或更高版本
- Maven 3.6+
- MySQL 8.0+
- Node.js 14+ (可选，用于前端构建)

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
   docker-compose --version
   ```

## 🚀 快速启动

### 方式一：Docker一键启动（推荐，Windows/Mac/Linux）

#### Windows 10用户
```batch
# 双击运行启动脚本
start.bat
```

或在PowerShell/CMD中运行：
```powershell
docker-compose up -d
```

#### Linux/Mac用户
```bash
# 给脚本执行权限
chmod +x start.sh

# 运行启动脚本
./start.sh
```

或直接用docker-compose：
```bash
docker-compose up -d
```

### 方式二：本地开发运行

#### 1. 配置数据库
确保MySQL服务运行在本地3306端口，创建数据库：
```sql
CREATE DATABASE campus_forum DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

执行初始化脚本：
```bash
mysql -u root -p campus_forum < src/main/resources/db/init.sql
```

#### 2. 安装依赖
```bash
mvn clean install
```

#### 3. 编译项目
```bash
mvn package -DskipTests
```

#### 4. 运行应用
```bash
mvn spring-boot:run
```

或用IDE导入Maven项目，直接运行`CampusForumApplication`类。

## 📱 应用访问

### Docker部署后
- **应用地址**: http://localhost:8080
- **默认管理员账号**: 
  - 用户名: `admin`
  - 密码: `admin123`

等待15-20秒让数据库完全初始化后即可访问。

### 本地开发运行
- **应用地址**: http://localhost:8080
- **API文档**: http://localhost:8080/swagger-ui.html (如配置)

## 📚 API接口文档

### 认证相关
```
POST   /api/auth/register          - 用户注册
POST   /api/auth/login             - 用户登录
POST   /api/auth/logout            - 用户登出
GET    /api/auth/check-username/:username  - 检查用户名
GET    /api/auth/check-email/:email        - 检查邮箱
```

### 帖子管理
```
POST   /api/posts                  - 创建帖子
GET    /api/posts                  - 获取帖子列表（分页）
GET    /api/posts/:id              - 获取帖子详情
PUT    /api/posts/:id              - 编辑帖子
DELETE /api/posts/:id              - 删除帖子
GET    /api/posts/category/:category - 按分类获取帖子
GET    /api/posts/user/:userId     - 获取用户帖子
GET    /api/posts/search           - 搜索帖子
POST   /api/posts/:id/pin          - 置顶帖子
POST   /api/posts/:id/lock         - 锁定帖子
```

### 评论管理
```
POST   /api/comments               - 发表评论
GET    /api/comments/:id           - 获取评论
GET    /api/comments/post/:postId  - 获取帖子评论
GET    /api/comments/user/:userId  - 获取用户评论
PUT    /api/comments/:id           - 编辑评论
DELETE /api/comments/:id           - 删除评论
```

### 文件资源
```
POST   /api/resources/upload       - 上传文件
GET    /api/resources/:id          - 获取文件信息
GET    /api/resources/post/:postId - 获取帖子附件
GET    /api/resources/download/:id - 下载文件
DELETE /api/resources/:id          - 删除文件
```

### 用户管理
```
GET    /api/users/:id              - 获取用户信息
GET    /api/users/profile/:username - 通过用户名获取用户
PUT    /api/users/:id              - 更新用户信息
DELETE /api/users/:id              - 删除用户
```

## 🗂️ 项目结构

```
CampusForum/
├── src/
│   ├── main/
│   │   ├── java/com/campusforum/
│   │   │   ├── CampusForumApplication.java       # 启动类
│   │   │   ├── config/                           # 配置类
│   │   │   │   ├── SecurityConfig.java           # Spring Security
│   │   │   │   ├── WebConfig.java                # Web配置
│   │   │   │   └── FileUploadConfig.java         # 文件上传配置
│   │   │   ├── controller/                       # 控制层
│   │   │   │   ├── AuthController.java           # 认证
│   │   │   │   ├── PostController.java           # 帖子
│   │   │   │   ├── CommentController.java        # 评论
│   │   │   │   ├── ResourceController.java       # 文件资源
│   │   │   │   └── UserController.java           # 用户
│   │   │   ├── service/                          # 业务逻辑层
│   │   │   │   ├── UserService.java
│   │   │   │   ├── PostService.java
│   │   │   │   ├── CommentService.java
│   │   │   │   ├── ResourceService.java
│   │   │   │   └── impl/                         # 实现类
│   │   │   ├── repository/                       # 数据访问层
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── PostRepository.java
│   │   │   │   ├── CommentRepository.java
│   │   │   │   └── ResourceRepository.java
│   │   │   ├── entity/                           # 实体类
│   │   │   │   ├── User.java
│   │   │   │   ├── Post.java
│   │   │   │   ├── Comment.java
│   │   │   │   └── Resource.java
│   │   │   ├── dto/                              # 数据传输对象
│   │   │   │   ├── ApiResponse.java
│   │   │   │   ├── UserDTO.java
│   │   │   │   ├── PostDTO.java
│   │   │   │   ├── CommentDTO.java
│   │   │   │   └── ResourceDTO.java
│   │   │   └── util/                             # 工具类
│   │   └── resources/
│   │       ├── application.yml                   # 应用配置
│   │       ├── application-dev.yml               # 开发环境配置
│   │       ├── application-docker.yml            # Docker环境配置
│   │       ├── db/
│   │       │   └── init.sql                      # 数据库初始化脚本
│   │       ├── templates/                        # Thymeleaf模板
│   │       │   ├── index.html                    # 首页
│   │       │   ├── register.html                 # 注册页
│   │       │   ├── login.html                    # 登录页
│   │       │   ├── post-list.html                # 帖子列表
│   │       │   ├── post-detail.html              # 帖子详情
│   │       │   ├── post-edit.html                # 发布帖子
│   │       │   ├── user-profile.html             # 用户资料
│   │       │   └── layout.html                   # 页面布局
│   │       └── static/                           # 静态资源
│   │           ├── css/
│   │           │   └── style.css                 # 样式表
│   │           └── js/
│   │               ├── api.js                    # API函数库
│   │               ├── utils.js                  # 工具函数库
│   │               └── main.js                   # 主要逻辑
│   └── test/                                     # 测试
├── pom.xml                                        # Maven配置
├── Dockerfile                                     # Docker镜像配置
├── docker-compose.yml                             # Docker Compose配置
├── start.sh                                       # Linux/Mac启动脚本
├── start.bat                                      # Windows启动脚本
├── Makefile                                       # Make快速命令
├── .dockerignore                                  # Docker忽略文件
├── .gitignore                                     # Git忽略文件
├── .env.example                                   # 环境变量示例
├── README.md                                      # 项目说明文档
└── LICENSE                                        # 许可证
```

## 🛠️ 常用命令

### Maven命令
```bash
# 清理并安装依赖
mvn clean install

# 编译项目
mvn compile

# 打包项目
mvn package -DskipTests

# 运行测试
mvn test

# 运行应用
mvn spring-boot:run
```

### Docker命令
```bash
# 构建镜像
docker-compose build

# 启动容器（后台运行）
docker-compose up -d

# 停止容器
docker-compose down

# 查看日志（实时）
docker-compose logs -f app

# 查看运行中的容器
docker-compose ps

# 重启容器
docker-compose restart

# 进入数据库容器
docker-compose exec db mysql -u root -proot campus_forum

# 查看容器资源使用
docker stats
```

### Make命令（推荐）
```bash
# 查看所有可用命令
make help

# 安装依赖
make install

# 编译项目
make build

# 启动Docker（推荐）
make docker-up

# 停止Docker
make docker-down

# 查看日志
make docker-logs

# 一键启动（完整流程）
make start

# 重启
make restart

# 清理所有资源
make docker-clean
```

## 🔧 配置说明

### 文件大小限制
默认20MB（`application.yml`中配置）：
```yaml
spring:
  servlet:
    multipart:
      max-file-size: 20MB
      max-request-size: 20MB
```

### 数据库字符集
已配置为`utf8mb4_unicode_ci`，完全支持中文和表情符号。

### 上传文件存储路径
- **Docker环境**: `/var/lib/campusforum/uploads`
- **本地开发**: `./uploads`

### 日志配置
日志级别可在`application.yml`中调整：
```yaml
logging:
  level:
    root: INFO
    com.campusforum: DEBUG
```

## 🔐 安全说明

1. **密码加密** - 使用BCrypt算法加密存储
2. **SQL注入防护** - 使用JPA自动参数化查询
3. **XSS防护** - 前端HTML转义，后端输出编码
4. **CSRF保护** - Spring Security CSRF令牌保护
5. **上传文件安全**:
   - 文件大小限制（20MB）
   - 生成随机文件名存储
   - 禁止执行上传的脚本文件

## 🐛 故障排排除

### Docker启动后无法访问
1. 检查容器是否运行：`docker-compose ps`
2. 查看日志：`docker-compose logs app`
3. 检查防火墙是否阻止8080端口
4. 确保没有其他应用占用8080端口

### 数据库连接失败
1. 检查MySQL容器状态：`docker-compose logs db`
2. 等待数据库完全初始化（约10-15秒）
3. 验证数据库连接：`docker-compose exec db mysql -u root -proot -e "SHOW DATABASES;"`

### 中文显示乱码
1. 确保数据库字符集为`utf8mb4`
2. 检查`application.yml`中的字符编码配置
3. 浏览器设置正确的字符集（一般自动检测）

### 文件上传失败
1. 检查文件大小是否超过20MB
2. 确保上传目录有写入权限
3. 检查磁盘空间是否充足

### 应用启动缓慢
1. Docker首次启动需要初始化数据库，耐心等待
2. 如使用虚拟化环境，确保分配足够的CPU和内存
3. 检查网络连接（某些依赖需要从网络下载）

## 📖 使用指南

### 注册新用户
1. 点击"注册"链接
2. 填写用户名、邮箱、密码
3. 设置真实姓名（可选）
4. 点击"注册"按钮

### 发布帖子
1. 登录账户
2. 点击"发布新帖"按钮
3. 选择分类（讨论/求助/分享/新闻）
4. 填写标题和内容
5. 可选：上传多个附件（每个不超过20MB）
6. 点击"发布"

### 评论和回复
1. 在帖子详情页面
2. 在评论框输入内容
3. 点击"发表评论"
4. 可以回复其他评论

### 下载文件
1. 在帖子详情页面找到附件区
2. 点击"下载"按钮
3. 文件保存到本地下载文件夹

## 🤝 贡献指南

欢迎提交Issue和Pull Request改进项目！

### 代码风格
- Java代码遵循Google Java Style Guide
- 使用4个空格缩进
- 变量名使用驼峰命名法
- 方法名以动词开头

### 测试要求
- 新功能需附带单元测试
- 边界条件需测试
- 运行所有测试：`mvn test`

## 📝 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 📞 支持和联系

如有问题或建议，请：
1. 提交Issue
2. 发送邮件至 admin@campusforum.com
3. 查阅项目Wiki文档

## 🎓 学习资源

- [Spring Boot官方文档](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Spring Data JPA文档](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)
- [Bootstrap官方文档](https://getbootstrap.com/docs/)
- [Docker官方文档](https://docs.docker.com/)

## 🏆 致谢

感谢所有贡献者和用户的支持！

---

**最后更新**: 2026年3月8日  
**版本**: 1.0.0  
**维护者**: Campus Forum Team
