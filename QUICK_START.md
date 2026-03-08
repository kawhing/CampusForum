# 快速参考指南

## 目录结构总结

```
CampusForum/
├── pom.xml                          # Maven配置
├── Dockerfile                        # Docker镜像配置
├── docker-compose.yml               # Docker编排配置
├── start.sh / start.bat             # 启动脚本
├── Makefile                         # 快速命令集
├── README.md                        # 项目说明
├── DEPLOYMENT_WINDOWS.md            # Windows部署指南
├── .dockerignore                    # Docker忽略文件
├── .gitignore                       # Git忽略文件
│
└── src/main/
    ├── java/com/campusforum/
    │   ├── CampusForumApplication.java          # 启动类
    │   ├── config/                              # 配置类
    │   ├── controller/                          # 控制层
    │   ├── service/                             # 业务逻辑
    │   ├── repository/                          # 数据访问
    │   ├── entity/                              # 实体类
    │   ├── dto/                                 # DTO类
    │   └── util/                                # 工具类
    │
    └── resources/
        ├── application.yml                      # 主配置
        ├── application-dev.yml                  # 开发配置
        ├── application-docker.yml               # Docker配置
        ├── db/init.sql                          # 数据库初始化脚本
        ├── templates/                           # Thymeleaf模板
        │   ├── index.html                       # 首页
        │   ├── register.html                    # 注册页
        │   ├── login.html                       # 登录页
        │   ├── post-list.html                   # 帖子列表
        │   ├── post-detail.html                 # 帖子详情
        │   ├── post-edit.html                   # 发布帖子
        │   └── user-profile.html                # 用户资料
        └── static/
            ├── css/style.css                    # 样式表
            └── js/
                ├── api.js                       # API函数库
                ├── utils.js                     # 工具函数
                └── main.js                      # 主要逻辑
```

## 快速启动

### Windows 10用户（推荐）
```batch
# 双击运行
start.bat
```

### Linux/Mac用户
```bash
./start.sh
```

### 通用方法（所有系统）
```bash
docker-compose up -d
```

## 默认凭证

| 字段 | 值 |
|------|-----|
| 应用地址 | http://localhost:8080 |
| 用户名 | admin |
| 密码 | admin123 |
| 数据库 | campus_forum |
| 数据库用户 | root |
| 数据库密码 | root |

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | Spring Boot 2.7.14 |
| 数据库 | MySQL 8.0 |
| ORM框架 | Spring Data JPA |
| 前端框架 | Bootstrap 5 + Thymeleaf |
| API格式 | RESTful JSON |
| 认证 | Spring Security + BCrypt |
| 构建工具 | Maven 3.6+ |
| 容器化 | Docker + Docker Compose |

## 文件大小限制

- 单个文件：20MB
- 总请求大小：20MB（可在application.yml修改）

## 数据库配置

- 字符集：utf8mb4_unicode_ci
- 自动初始化：✓
- 数据持久化：✓（docker-compose卷）

## 关键特性清单

- [x] 用户注册/登录
- [x] 密码BCrypt加密
- [x] 帖子CRUD操作
- [x] 评论系统（支持嵌套回复）
- [x] 文件上传/下载（20MB限制）
- [x] 分类和搜索功能
- [x] 用户个人资料
- [x] 响应式UI设计
- [x] Docker一键部署
- [x] UTF-8完整支持

## 常用命令速查

```bash
# Docker命令
docker-compose up -d           # 启动
docker-compose down            # 停止
docker-compose logs -f app     # 查看日志
docker-compose ps              # 查看状态

# Make命令
make install                   # 安装依赖
make build                     # 编译
make docker-up                 # Docker启动
make docker-down               # Docker停止

# Maven命令
mvn clean install              # 清理并安装
mvn spring-boot:run            # 本地运行
mvn test                       # 运行测试
```

## 故障排查快速指南

| 问题 | 解决方案 |
|------|---------|
| 无法访问localhost:8080 | 等待30秒，检查防火墙，运行 `docker-compose logs app` |
| 数据库连接失败 | 运行 `docker-compose logs db`，等待初始化完成 |
| 中文显示乱码 | 确保字符集为utf8mb4，检查浏览器编码设置 |
| 文件上传失败 | 检查文件大小是否超过20MB，确保磁盘空间充足 |
| 容器无法启动 | 检查端口是否被占用，运行 `docker-compose down && docker-compose up -d` |

## 重要提示

1. **首次启动耗时**：Docker首次启动需要构建镜像并初始化数据库，可能需要2-3分钟
2. **默认密码**：务必修改默认的admin账户密码
3. **数据备份**：定期备份uploads和数据库目录
4. **日志查看**：遇到问题时，首先查看 `docker-compose logs` 输出
5. **文件权限**：Linux系统下确保uploads目录有写入权限

## 下一步建议

1. 修改管理员密码
2. 创建其他用户账户
3. 测试发布帖子和评论功能
4. 上传测试文件
5. 熟悉系统操作界面
6. 自定义样式和配置

## 获取帮助

1. 查看 [README.md](README.md) - 详细说明
2. 查看 [DEPLOYMENT_WINDOWS.md](DEPLOYMENT_WINDOWS.md) - Windows部署指南
3. 查看项目日志 - `docker-compose logs -f`
4. 查看源代码注释 - 了解实现细节

---

**现在您已准备好使用校园论坛系统！祝您使用愉快！** 🎉
