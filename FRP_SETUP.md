# Baby Hearts FRP 内网穿透配置指南

## 📋 概述

本指南将帮助你配置 FRP (Fast Reverse Proxy) 内网穿透，让 Baby Hearts 应用可以通过公网访问。

**服务器信息：**
- 公网IP: `111.230.110.95`
- FRP服务端口: `7000`
- HTTP端口: `80`
- HTTPS端口: `443`
- Dashboard端口: `7500`

## 🚀 快速开始

### 1. 自动部署（推荐）

```bash
# 给部署脚本执行权限
chmod +x deploy-frp.sh

# 客户端部署（本地机器）
./deploy-frp.sh client

# 服务端部署（腾讯云服务器）
./deploy-frp.sh server
```

### 2. 手动部署

#### 服务端配置（腾讯云服务器）

1. **下载并配置 FRP 服务端**
```bash
# 下载 frp
wget https://github.com/fatedier/frp/releases/download/v0.52.3/frp_0.52.3_linux_amd64.tar.gz
tar -xzf frp_0.52.3_linux_amd64.tar.gz
cd frp_0.52.3_linux_amd64

# 复制配置文件
cp /path/to/frps.ini ./
```

2. **启动服务端**
```bash
./frps -c frps.ini
```

3. **配置防火墙**
```bash
# Ubuntu/Debian
sudo ufw allow 7000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 7500/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=7000/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=7500/tcp
sudo firewall-cmd --reload
```

#### 客户端配置（本地机器）

1. **下载并配置 FRP 客户端**
```bash
# macOS
wget https://github.com/fatedier/frp/releases/download/v0.52.3/frp_0.52.3_darwin_amd64.tar.gz

# Linux
wget https://github.com/fatedier/frp/releases/download/v0.52.3/frp_0.52.3_linux_amd64.tar.gz

# 解压并复制配置
tar -xzf frp_*.tar.gz
cd frp_*
cp /path/to/frpc.ini ./
```

2. **启动客户端**
```bash
./frpc -c frpc.ini
```

## 🔧 配置说明

### 服务端配置 (frps.ini)

```ini
[common]
bind_port = 7000
vhost_http_port = 80
vhost_https_port = 443
token = babyhearts_2024
dashboard_port = 7500
dashboard_user = admin
dashboard_pwd = babyhearts_admin_2024
```

### 客户端配置 (frpc.ini)

```ini
[common]
server_addr = 111.230.110.95
server_port = 7000
token = babyhearts_2024

[babyhearts-web]
type = http
local_ip = 127.0.0.1
local_port = 5173
custom_domains = babyhearts.example.com

[ollama-ai]
type = http
local_ip = 127.0.0.1
local_port = 11434
custom_domains = ai.babyhearts.example.com
```

## 🌐 访问方式

### 1. 使用域名访问（推荐）

如果你有域名，请将以下域名解析到 `111.230.110.95`：

- `babyhearts.example.com` → Baby Hearts 主应用
- `ai.babyhearts.example.com` → Ollama AI 服务
- `api.babyhearts.example.com` → API 服务（如果有）

### 2. 使用IP访问

如果没有域名，可以修改配置使用子域名：

```ini
# 在 frpc.ini 中修改
[babyhearts-web]
type = http
local_ip = 127.0.0.1
local_port = 5173
subdomain = babyhearts
```

然后通过 `http://babyhearts.111.230.110.95` 访问

### 3. 直接端口访问

也可以配置直接端口映射：

```ini
[babyhearts-direct]
type = tcp
local_ip = 127.0.0.1
local_port = 5173
remote_port = 8080
```

通过 `http://111.230.110.95:8080` 访问

## 📊 监控和管理

### FRP Dashboard

访问 `http://111.230.110.95:7500` 查看 FRP 状态

- 用户名: `admin`
- 密码: `babyhearts_admin_2024`

### 日志查看

```bash
# 查看服务端日志
tail -f frps.log

# 查看客户端日志
tail -f frpc.log
```

## 🔄 启动和停止

### 使用脚本启动

```bash
# 启动客户端
./start-frpc.sh

# 启动服务端
./start-frps.sh
```

### 后台运行

```bash
# 客户端后台运行
nohup ./frpc -c frpc.ini > frpc.log 2>&1 &

# 服务端后台运行
nohup ./frps -c frps.ini > frps.log 2>&1 &
```

### 系统服务（Linux）

```bash
# 安装为系统服务
sudo cp frps.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable frps
sudo systemctl start frps

# 查看状态
sudo systemctl status frps
```

## 🛠️ 完整部署流程

### 1. 服务器端部署

```bash
# 1. 登录腾讯云服务器
ssh root@111.230.110.95

# 2. 创建工作目录
mkdir -p /opt/babyhearts-frp
cd /opt/babyhearts-frp

# 3. 上传配置文件
# 将 frps.ini 和 deploy-frp.sh 上传到服务器

# 4. 运行部署脚本
chmod +x deploy-frp.sh
./deploy-frp.sh server

# 5. 配置防火墙
./setup-firewall.sh

# 6. 启动服务
./start-frps.sh
```

### 2. 客户端部署

```bash
# 1. 在本地项目目录
cd /path/to/BabyHearts

# 2. 运行部署脚本
chmod +x deploy-frp.sh
./deploy-frp.sh client

# 3. 启动 FRP 客户端
./start-frpc.sh

# 4. 启动 Baby Hearts 应用
npm run dev

# 5. 启动 Ollama（如果需要AI功能）
ollama serve
```

## 🔍 故障排除

### 常见问题

1. **连接失败**
   - 检查服务器防火墙设置
   - 确认token配置一致
   - 检查网络连通性

2. **端口冲突**
   - 修改配置文件中的端口
   - 检查端口是否被占用

3. **域名解析问题**
   - 确认域名DNS解析正确
   - 可以先使用IP访问测试

### 检查命令

```bash
# 检查端口监听
netstat -tlnp | grep 7000

# 检查进程
ps aux | grep frp

# 测试连接
telnet 111.230.110.95 7000

# 检查日志
tail -f frps.log
tail -f frpc.log
```

## 📱 移动端访问

配置完成后，可以通过以下方式在移动设备上访问：

1. **局域网访问**: `http://你的内网IP:5173`
2. **公网访问**: `http://111.230.110.95:端口` 或域名
3. **二维码分享**: 生成访问链接的二维码供他人扫描

## 🔒 安全建议

1. **修改默认密码**
   - 更改 dashboard 密码
   - 使用强token

2. **启用HTTPS**
   - 配置SSL证书
   - 强制HTTPS访问

3. **访问控制**
   - 配置IP白名单
   - 使用防火墙限制访问

4. **定期更新**
   - 更新FRP版本
   - 监控安全公告

## 📞 技术支持

如果遇到问题，请检查：

1. 配置文件语法
2. 网络连通性
3. 防火墙设置
4. 日志文件内容

更多信息请参考 [FRP 官方文档](https://github.com/fatedier/frp) 