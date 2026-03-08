# Windows 10 部署指南

本指南详细说明如何在Windows 10上部署和运行校园论坛项目。

## 环境检查清单

在开始部署前，请确保已安装以下软件：

- [ ] Docker Desktop for Windows
- [ ] Git (用于克隆项目)
- [ ] 浏览器 (Chrome、Firefox、Edge等)

## 步骤1：安装Docker Desktop

### 1.1 下载Docker Desktop
访问 [Docker官方网站](https://www.docker.com/products/docker-desktop) 下载Windows版本。

### 1.2 安装Docker
1. 双击下载的`Docker Desktop Installer.exe`
2. 勾选"Install required Windows components for WSL 2"
3. 点击"Install"按钮
4. 安装完成后重启计算机

### 1.3 验证安装
1. 打开PowerShell或CMD
2. 运行以下命令：
```powershell
docker --version
docker-compose --version
```

如果都显示版本号，说明安装成功。

## 步骤2：获取项目

### 方式A：使用Git克隆（推荐）
```powershell
# 克隆项目
git clone https://github.com/yourname/campusforum.git

# 进入项目目录
cd campusforum
```

### 方式B：下载ZIP文件
1. 访问项目仓库
2. 点击"Code" → "Download ZIP"
3. 解压到本地目录

## 步骤3：启动应用

### 方式A：双击启动脚本（最简单）

1. 打开项目目录
2. 双击 `start.bat` 文件
3. 等待脚本执行完成
4. 窗口会自动显示启动信息

**注意**: 如果出现"无法找到文件"错误，请用PowerShell运行：
```powershell
# 在项目根目录打开PowerShell
.\start.bat
```

### 方式B：PowerShell/CMD命令行启动

1. 打开PowerShell或CMD
2. 进入项目目录：
```powershell
cd C:\path\to\campusforum
```

3. 执行docker-compose命令：
```powershell
# 构建镜像（首次启动需要）
docker-compose build --no-cache

# 启动容器（后台运行）
docker-compose up -d
```

4. 等待15-20秒让服务完全启动

## 步骤4：验证应用启动

### 检查容器状态
```powershell
docker-compose ps
```

应该看到两个容器都在运行：
- `campusforum-mysql` - DATABASE
- `campusforum-app` - RUNNING

### 查看启动日志
```powershell
docker-compose logs -f app
```

看到"Started CampusForumApplication"说明应用启动成功。

### 查看数据库日志
```powershell
docker-compose logs -f db
```

看到"[Server] /docker-entrypoint.sh: MySQL init process done"说明数据库初始化完成。

## 步骤5：访问应用

在浏览器中打开：
```
http://localhost:8080
```

### 首次登录
使用默认管理员账户：
- **用户名**: `admin`
- **密码**: `admin123`

**建议**: 首次登录后，修改管理员密码。

## 常见问题解决

### 问题1：端口8080被占用

**错误信息**:
```
Error response from daemon: Ports are not available
```

**解决方案**:
```powershell
# 查看占用8080端口的进程
netstat -ano | findstr :8080

# 停止该进程（PID替换为实际PID）
taskkill /PID <PID> /F

# 或者修改docker-compose.yml中的端口
# 将 "8080:8080" 改为 "8081:8080"
```

### 问题2：无法访问 localhost:8080

**可能原因**：
1. 容器还在启动中
2. 防火墙阻止
3. Docker网络问题

**解决方案**：
```powershell
# 等待30秒让服务完全启动
Start-Sleep -Seconds 30

# 检查容器日志
docker-compose logs app

# 重启容器
docker-compose restart app

# 如果仍无法访问，检查防火墙
# Windows Defender防火墙 → 允许应用 → 找Docker并允许
```

### 问题3：数据库连接失败

**错误信息**:
```
com.mysql.cj.jdbc.exceptions.CommunicationsException
```

**解决方案**：
```powershell
# 查看数据库日志
docker-compose logs db

# 等待数据库完全初始化（约15秒）
# 重启应用
docker-compose restart app

# 检查数据库连接
docker-compose exec db mysql -u root -proot -e "SELECT 1"
```

### 问题4：中文显示乱码

**解决方案**：
1. 确保数据库字符集正确：
```powershell
docker-compose exec db mysql -u root -proot -c "SHOW VARIABLES LIKE 'character%';"
```

应看到 `utf8mb4` 字符集。

2. 浏览器设置（一般自动：
   - 按F12打开开发者工具
   - Console中查看是否有编码错误

### 问题5：认证失败

**表现**：注册或登录时显示错误

**解决方案**：
1. 清除浏览器缓存和Cookie
2. 使用隐私浏览模式重新登录
3. 查看浏览器开发者工具Network标签的响应

### 问题6：文件上传失败

**表现**：上传文件时出错

**可能原因和解决**：
```powershell
# 检查文件大小限制
# 查看Docker进程资源使用
docker stats

# 检查磁盘空间
# 创建上传目录（如果不存在）
mkdir uploads

# 检查目录权限
icacls uploads /grant:r $env:USERNAME":(F)" /T
```

## 常用管理命令

### 查看应用日志（实时）
```powershell
docker-compose logs -f app
```

### 查看数据库日志
```powershell
docker-compose logs -f db
```

### 进入数据库交互终端
```powershell
docker-compose exec db mysql -u root -proot campus_forum
```

在数据库中执行SQL：
```sql
-- 查看所有用户
SELECT * FROM users;

-- 查看所有帖子
SELECT * FROM posts;

-- 修改管理员密码（hash为BCrypt编码后的密码）
UPDATE users SET password='$2a$10$...' WHERE username='admin';
```

### 停止应用
```powershell
docker-compose down
```

### 完全清理容器和卷
```powershell
docker-compose down -v
```

**警告**: 清理后数据库数据会丢失！

### 重启应用
```powershell
docker-compose restart
```

### 查看容器状态
```powershell
docker-compose ps

# 更详细的信息
docker ps -a
```

## 数据备份

### 备份数据库
```powershell
# 导出数据库
docker-compose exec db mysqldump -u root -proot campus_forum > backup.sql

# 恢复数据库
docker-compose exec db mysql -u root -proot campus_forum < backup.sql
```

### 备份上传文件
```powershell
# 将uploads目录复制到备份位置
Copy-Item -Path "uploads" -Destination "backup/uploads" -Recurse -Force
```

## 性能优化

### 增加内存分配
1. 右键Docker Desktop系统托盘图标
2. 选择"Settings"
3. 在"Resources"中增加"Memory"
4. 建议分配2GB或更多

### 清理未使用的Docker资源
```powershell
# 删除未使用的镜像
docker image prune -a

# 删除悬挂的卷
docker volume prune

# 完整清理
docker system prune -a --volumes
```

## 开发调试

### 查看项目中的日志配置
编辑 `src/main/resources/application-dev.yml`:
```yaml
logging:
  level:
    root: INFO
    com.campusforum: DEBUG  # 改为DEBUG获得更详细的日志
```

### 启用SQL日志
编辑 `application-dev.yml`:
```yaml
spring:
  jpa:
    show-sql: true          # 显示SQL语句
    properties:
      hibernate:
        format_sql: true    # 格式化SQL显示
```

### 远程调试
如需远程调试，修改Dockerfile：
```dockerfile
# 添加JVM调试参数
ENV JAVA_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"
```

修改docker-compose.yml暴露5005端口。

## 更新项目

### 获取最新代码
```powershell
# 如使用Git
git pull origin main

# 重新构建并启动
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 更新依赖
```powershell
# 更新Maven依赖
mvn clean install

# 重新构建Docker镜像
docker-compose build --no-cache
```

## 卸载/清理

### 完全卸载应用
```powershell
# 停止并删除所有容器和卷
docker-compose down -v

# 删除Docker镜像
docker rmi campusforum_app
docker rmi mysql:8.0
```

### 卸载Docker Desktop
1. 在Windows设置中找到"应用和功能"
2. 找到"Docker Desktop"
3. 点击卸载

## 获取帮助

### 查看文档
- [README.md](README.md) - 项目总体说明
- [API文档路径] - REST API文档

### 常见问题FAQ
1. 检查README.md中的"🐛 故障排除"部分
2. 查看项目Issues页面

### 反馈问题
提交Issue时请包括：
1. Windows版本（Win10 20H2等）
2. Docker版本
3. 完整错误日志
4. 重现步骤

---

**部署完成！祝您使用愉快！** 🎉

如有任何问题，请参考本指南的"常见问题解决"部分或提交Issue。
