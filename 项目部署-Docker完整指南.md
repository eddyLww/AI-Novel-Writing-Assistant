# AI 小说写作助理 - 宝塔 + Docker 极速部署指南

> **核心原理**：针对低配置云服务器（如 2核2G/2核4G），为避免在线 Docker Build 导致 CPU 100% 满载卡死与内存溢出（OOM），本方案采用 **“本地电脑打好 Docker 镜像 -> 导出镜像包 -> 上传服务器一键载入”** 模式。
> 服务器端 **0 编译、0 CPU 耗能、0 依赖缺失风险**，3 秒极速上线！

---

## 目录
1. [前置准备与环境设置](#一前置准备与环境设置)
2. [本地电脑：打包镜像与导出](#二本地电脑打包镜像与导出)
3. [服务器端：部署与镜像载入](#三服务器端部署与镜像载入)
4. [宝塔 Nginx 反向代理与 SSL 证书设置](#四宝塔-nginx-反向代理与-ssl-证书设置)
5. [常见问题与维护指令](#五常见问题与维护指令)

---

## 一、前置准备与环境设置

### 1. 本地电脑环境
- 已安装 **Docker Desktop for Windows** 并开启运行。
- 若国内网络拉取基础镜像缓慢，需在 Docker Desktop `Settings -> Docker Engine` 中配置镜像源：
  ```json
  {
    "registry-mirrors": [
      "https://docker.m.daocloud.io",
      "https://docker.anyhub.us.kg",
      "https://dhub.kubesre.xyz"
    ]
  }
  ```

### 2. 云服务器环境
- 腾讯云 / 阿里云等 Linux 服务器（CentOS / Ubuntu / Debian 均可）。
- 安装有 **宝塔面板**（或 1Panel 面板）。
- 安装好 **Docker** 和 **Nginx** 插件。

---

## 二、本地电脑：打包镜像与导出

在本地项目根目录 `D:\00自媒体创业\AI写作\AI-Novel-Writing-Assistant` 打开终端（PowerShell 或 CMD），依序运行以下命令：

### 1. 构建后端 API 镜像
```cmd
docker build -t ai-novel-api:latest -f Dockerfile.api .
```

### 2. 构建前端 Web 镜像
*(替换 `aiaixs.eddy.ink` 为你的实际二级域名)*
```cmd
docker build -t ai-novel-web:latest --build-arg VITE_API_BASE_URL=https://aiaixs.eddy.ink/api -f Dockerfile.web .
```

### 3. 将前后端镜像合并导出为一个文件
```cmd
docker save -o ai-novel-images.tar ai-novel-api:latest ai-novel-web:latest
```
*(运行后将在本地根目录生成 `ai-novel-images.tar` 文件，约 200MB - 300MB)*

---

## 三、服务器端：部署与镜像载入

### 1. 创建服务器项目目录
在宝塔面板进入文件管理，创建目录：
`/www/wwwroot/ai-novel-docker/`
并在该目录下创建持久化数据文件夹：
```bash
mkdir -p /www/wwwroot/ai-novel-docker/storage
chmod -R 777 /www/wwwroot/ai-novel-docker/storage
```

### 2. 上传文件
通过宝塔面板文件管理，将本地生成的 `ai-novel-images.tar` 上传到 `/www/wwwroot/ai-novel-docker/` 目录下。

### 3. 创建 `docker-compose.yml`
在 `/www/wwwroot/ai-novel-docker/docker-compose.yml` 中写入以下完整配置：

```yaml
version: '3.8'

services:
  # 1. 后端 API 服务
  api:
    image: ai-novel-api:latest
    container_name: ai-novel-api
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/storage/dev.db
    volumes:
      - ./storage:/app/storage
    # 容器启动时自动执行数据库 Migration/Push 建表，然后再启动 node 服务
    command: sh -c "npx prisma db push --config prisma.config.ts --schema src/prisma/schema.prisma && node dist/app.js"
    working_dir: /app/server

  # 2. 前端 Nginx 网页服务
  web:
    image: ai-novel-web:latest
    container_name: ai-novel-web
    restart: always
    ports:
      - "8881:8080"  # 注意：前端容器内部 Nginx 监听 8080 端口
    depends_on:
      - api
```

### 4. 载入镜像并启动容器
打开宝塔终端，运行：
```bash
cd /www/wwwroot/ai-novel-docker

# 1. 载入 Docker 镜像（几秒钟完成）
docker load -i ai-novel-images.tar

# 2. 启动服务容器
docker-compose up -d
```

确认容器运行状态：
```bash
docker ps
```
确保 `ai-novel-api` 和 `ai-novel-web` 都处于 **`Up`** 状态。

---

## 四、宝塔 Nginx 反向代理与 SSL 证书设置

### 1. 宝塔添加站点
1. 在宝塔面板 -> 网站 -> 添加站点。
2. 域名填写：`aiaixs.eddy.ink`。
3. 根目录保持默认，PHP 版本选择 **“静态”**。

### 2. 申请 SSL 证书（HTTPS 绿标）
1. 点击站点设置 -> **SSL证书**。
2. 选择 **宝塔证书 (TrustAsia 免费版)** 或 **Let's Encrypt**。
3. 勾选域名申请并下发，申请完成后开启右上角的 **“强制 HTTPS”**。

### 3. 配置 Nginx 反向代理规则
点击站点设置 -> **配置文件**，将全套规则替换为以下标准反代配置：

```nginx
server
{
    listen 80;
    listen 443 ssl http2;
    server_name aiaixs.eddy.ink;
    index index.html index.htm;
    root /www/wwwroot/aiaixs.eddy.ink;
    
    # 宝塔自动生成的 SSL 证书路径
    ssl_certificate    /www/server/panel/vhost/cert/aiaixs.eddy.ink/fullchain.pem;
    ssl_certificate_key  /www/server/panel/vhost/cert/aiaixs.eddy.ink/privkey.pem;
    ssl_protocols TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers EECDH+CHACHA20:EECDH+CHACHA20-draft:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 强制 HTTP 跳转 HTTPS
    if ($server_port !~ 443){
        rewrite ^(/.*)$ https://$host$1 permanent;
    }

    # 放行宝塔 SSL 文件验证路径
    location ^~ /.well-known/ {
        root /www/wwwroot/aiaixs.eddy.ink;
    }

    # 1. 前端页面代理到 Docker 8881 端口
    location / {
        proxy_pass http://127.0.0.1:8881/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 2. 后端 API 接口代理到 Docker 3000 端口
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # 延长超时限制以支持长文本 AI 写作生成
        proxy_connect_timeout 300s;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

保存配置文件后，浏览器访问 `https://aiaixs.eddy.ink` 即可正常使用！

---

## 五、常见问题与维护指令

### 1. 常用维护指令
```bash
cd /www/wwwroot/ai-novel-docker

# 查看容器运行状态
docker ps

# 查看后端日志
docker logs -f ai-novel-api

# 查看前端日志
docker logs -f ai-novel-web

# 重启所有服务
docker-compose restart

# 彻底停止服务
docker-compose down
```

# 强制重建前端容器
docker-compose up -d


# 强制重建前端容器
docker-compose up -d --force-recreate web


### 2. 踩坑避坑说明
1. **端口冲突/拒绝连接**：
   - 网页容器 `ai-novel-web` 的 Nginx 在 Docker 镜像内部默认监听的是 **8080** 端口，因此 Compose 的端口映射必须为 `"8881:8080"`。
2. **Prisma 数据库初始化**：
   - `command` 命令中必须配置 `npx prisma db push ...`，数据库才能自动在 SQLite 中创建完整的 `dev.db` 表结构。
3. **数据库与数据安全**：
   - 数据库存放在宿主机的 `/www/wwwroot/ai-novel-docker/storage/dev.db`，更新镜像/重启容器数据完全不会丢失。
