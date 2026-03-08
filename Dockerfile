# 使用Java 11作为基础镜像
FROM eclipse-temurin:11-jre

# 设置工作目录
WORKDIR /app

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 从Maven构建的WAR/JAR文件
ARG JAR_FILE=target/campusforum-1.0.0.jar
COPY ${JAR_FILE} app.jar

# 创建日志目录
RUN mkdir -p /var/lib/campusforum/logs
RUN mkdir -p /var/lib/campusforum/uploads

# 暴露应用端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD java -cp app.jar org.springframework.boot.loader.JarLauncher \
  || curl -f http://localhost:8080/api/posts/1 || exit 1

# 启动应用
ENTRYPOINT ["java", "-jar", "app.jar"]
