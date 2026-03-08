# 注册功能修复总结

## 问题描述

用户点击注册按钮或提交注册表单后，页面重定向到登录页，导致注册功能无法正常工作。

## 根本原因

### 1. **Spring Security 权限配置问题**

**问题**：`SecurityConfig` 中未将注册页面 (`/register`) 和登录页面 (`/login`) 放行，导致未认证用户无法访问这些页面。

**原配置**：
```java
.antMatchers("/", "/index", "/static/**", "/db/**").permitAll()
```

虽然已放行 `/api/auth/**` 接口，但访问 `/register` 页面本身被拦截，触发 Spring Security 的登录重定向逻辑。

### 2. **数据库字符编码问题**

**问题**：JDBC 连接 URL 参数配置不正确，导致 MySQL 驱动无法正确识别和处理 UTF-8 中文字符。

**原参数**：`characterEncoding=utf8mb4`（Java 11 不识别此编码）

## 修复方案

### 1. **修改 SecurityConfig.java**

添加缺失的权限放行规则：

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
            .csrf().disable()
            .authorizeRequests()
                .antMatchers("/", "/index", "/register", "/login", "/static/**", "/css/**", "/js/**", "/db/**").permitAll()
                .antMatchers("/api/auth/**").permitAll()
                .antMatchers("/api/posts/**").permitAll()
                .antMatchers("/api/comments/**").permitAll()
                .antMatchers("/api/resources/**").permitAll()
                .antMatchers("/api/users/profile/**").permitAll()
                .antMatchers("/profile/**").permitAll()
                .anyRequest().authenticated()
                .and()
            .formLogin()
                .loginPage("/login")
                .permitAll()
                .and()
            .logout()
                .permitAll();
    return http.build();
}
```

**关键改动**：
- ✅ `/register` - 注册页面
- ✅ `/login` - 登录页面
- ✅ `/css/**` - CSS 资源
- ✅ `/js/**` - JavaScript 资源
- ✅ `/profile/**` - 用户个人资料页面

### 2. **修改数据库连接配置**

**所有配置文件**（`application.yml`、`application-dev.yml`、`application-docker.yml`、`docker-compose.yml`）中的数据库连接 URL：

**原参数**：
```
jdbc:mysql://localhost:3306/campus_forum?useSSL=false&serverTimezone=UTC&characterEncoding=utf8mb4
```

**新参数**：
```
jdbc:mysql://localhost:3306/campus_forum?useSSL=false&serverTimezone=UTC&useUnicode=true&characterEncoding=UTF-8
```

**参数说明**：
- `useUnicode=true` - 明确启用 Unicode 支持
- `characterEncoding=UTF-8` - 使用 Java 11 标准支持的 UTF-8 编码
- MySQL 服务器端已配置 `utf8mb4` 字符集，JDBC 驱动会自动进行转换

## 修复验证

### 测试场景 1：访问注册页面

```bash
curl -i http://localhost:8080/register
```

**期望结果**：`HTTP/1.1 200 OK`（而不是 302 重定向）

✅ **验证通过**

### 测试场景 2：提交注册表单

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -d "username=test&email=test@example.com&password=pass123&realname=测试用户"
```

**期望结果**：
```json
{
  "code": 200,
  "message": "注册成功",
  "data": { /* 用户信息 */ }
}
```

✅ **验证通过**

### 测试场景 3：中文字符保存

```bash
# 注册中文用户
curl -X POST http://localhost:8080/api/auth/register \
  -d "username=chinese_user&email=chinese@test.com&password=pass123&realname=中文名字2026"

# 查询数据库
docker exec campusforum-mysql mysql -u root -proot --default-character-set=utf8mb4 \
  -e "SELECT username, realname FROM campus_forum.users WHERE username='chinese_user';"
```

**期望结果**：
```
chinese_user    中文名字2026
```

✅ **验证通过** - 中文字符正确保存和读取

### 测试场景 4：用户登录

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -d "username=chinese_user&password=pass123"
```

**期望结果**：
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 3,
      "username": "chinese_user",
      "realname": "中文名字2026",
      ...
    }
  }
}
```

✅ **验证通过**

## 修改的文件清单

1. **src/main/java/com/campusforum/config/SecurityConfig.java** - 修改权限配置
2. **src/main/resources/application.yml** - 修改 JDBC 连接参数
3. **src/main/resources/application-dev.yml** - 修改 JDBC 连接参数
4. **src/main/resources/application-docker.yml** - 修改 JDBC 连接参数
5. **docker-compose.yml** - 修改应用容器环境变量中的 JDBC 连接参数

## 相关说明

### 为什么使用 UTF-8 而不是 utf8mb4？

- **Java 字符集支持**：Java 11 的 `java.nio.charset` 原生支持 `UTF-8`，但不直接支持 `utf8mb4` 作为独立的 Java 编码
- **JDBC 驱动处理**：MySQL JDBC 驱动（mysql-connector-j 8.0.33）接收到 `characterEncoding=UTF-8` 时，会自动与 MySQL 服务器协商使用 `utf8mb4` 字符集
- **数据库配置**：已在 `docker-compose.yml` 中配置 MySQL 容器：
  ```yaml
  command:
    --character-set-server=utf8mb4
    --collation-server=utf8mb4_unicode_ci
  ```

这种做法确保了从 Java 应用到 MySQL 数据库的完整 UTF-8/utf8mb4 兼容性。

### 注册页面的工作流

1. 用户访问 `http://localhost:8080/register` → **现在返回 200 OK**（之前是 302 重定向到登录页）
2. 用户填写表单并提交 → 前端 JavaScript 拦截表单提交事件
3. 前端发送 AJAX POST 请求到 `/api/auth/register` → **由 permitAll() 放行**
4. 后端验证和注册用户 → 返回 `{code: 200, message: "注册成功"}`
5. 前端显示成功提示，然后重定向到登录页（由前端控制，不是由后端重定向）

## 部署验证

修复后重新构建和部署：

```bash
# 本地编译
mvn clean package -DskipTests

# Docker 重新部署
docker-compose down -v
docker image rmi campusforum-app:latest
docker-compose up -d

# 验证应用启动
docker ps
docker logs campusforum-app
```

所有容器应在 20-30 秒内启动完成，应用可在 `http://localhost:8080` 访问。

## 下一步建议

1. **增强用户体验**：
   - 在注册页面添加实时验证反馈（用户名/邮箱是否已存在）
   - 添加发送验证邮件功能（可选）

2. **安全性改进**：
   - 实现速率限制（防止暴力注册）
   - 添加 CAPTCHA 验证
   - 实现邮件验证确认

3. **监控和日志**：
   - 记录所有注册失败日志
   - 监控异常注册行为
