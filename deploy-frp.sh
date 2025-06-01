#!/bin/bash

# Baby Hearts FRP 部署脚本
# 用于配置内网穿透服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查操作系统
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="darwin"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        OS="windows"
    else
        log_error "不支持的操作系统: $OSTYPE"
        exit 1
    fi
    log_info "检测到操作系统: $OS"
}

# 检查架构
detect_arch() {
    ARCH=$(uname -m)
    case $ARCH in
        x86_64)
            ARCH="amd64"
            ;;
        aarch64|arm64)
            ARCH="arm64"
            ;;
        armv7l)
            ARCH="arm"
            ;;
        *)
            log_error "不支持的架构: $ARCH"
            exit 1
            ;;
    esac
    log_info "检测到架构: $ARCH"
}

# 下载frp
download_frp() {
    local version="0.52.3"
    local filename="frp_${version}_${OS}_${ARCH}"
    local url="https://github.com/fatedier/frp/releases/download/v${version}/${filename}.tar.gz"
    
    log_info "下载 frp v${version}..."
    
    if command -v wget >/dev/null 2>&1; then
        wget -O "${filename}.tar.gz" "$url"
    elif command -v curl >/dev/null 2>&1; then
        curl -L -o "${filename}.tar.gz" "$url"
    else
        log_error "需要 wget 或 curl 来下载文件"
        exit 1
    fi
    
    log_info "解压文件..."
    tar -xzf "${filename}.tar.gz"
    
    # 移动文件到当前目录
    mv "${filename}/frpc" ./
    mv "${filename}/frps" ./
    
    # 清理
    rm -rf "${filename}" "${filename}.tar.gz"
    
    # 设置执行权限
    chmod +x frpc frps
    
    log_success "frp 下载完成"
}

# 安装客户端
install_client() {
    log_info "配置 frp 客户端..."
    
    # 检查配置文件
    if [[ ! -f "frpc.ini" ]]; then
        log_error "找不到 frpc.ini 配置文件"
        exit 1
    fi
    
    # 创建启动脚本
    cat > start-frpc.sh << 'EOF'
#!/bin/bash
# Baby Hearts FRP 客户端启动脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "启动 Baby Hearts FRP 客户端..."
echo "配置文件: frpc.ini"
echo "日志文件: frpc.log"
echo "按 Ctrl+C 停止服务"
echo "=========================="

./frpc -c frpc.ini
EOF
    
    chmod +x start-frpc.sh
    
    log_success "客户端配置完成"
    log_info "使用 './start-frpc.sh' 启动客户端"
}

# 安装服务端
install_server() {
    log_info "配置 frp 服务端..."
    
    # 检查配置文件
    if [[ ! -f "frps.ini" ]]; then
        log_error "找不到 frps.ini 配置文件"
        exit 1
    fi
    
    # 创建启动脚本
    cat > start-frps.sh << 'EOF'
#!/bin/bash
# Baby Hearts FRP 服务端启动脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "启动 Baby Hearts FRP 服务端..."
echo "配置文件: frps.ini"
echo "日志文件: frps.log"
echo "Dashboard: http://111.230.110.95:7500"
echo "用户名: admin"
echo "密码: babyhearts_admin_2024"
echo "按 Ctrl+C 停止服务"
echo "=========================="

./frps -c frps.ini
EOF
    
    chmod +x start-frps.sh
    
    # 创建systemd服务文件（Linux）
    if [[ "$OS" == "linux" ]]; then
        cat > frps.service << EOF
[Unit]
Description=Baby Hearts FRP Server
After=network.target

[Service]
Type=simple
User=root
Restart=on-failure
RestartSec=5s
ExecStart=$(pwd)/frps -c $(pwd)/frps.ini
LimitNOFILE=1048576

[Install]
WantedBy=multi-user.target
EOF
        
        log_info "创建了 systemd 服务文件: frps.service"
        log_info "要安装为系统服务，请运行:"
        log_info "  sudo cp frps.service /etc/systemd/system/"
        log_info "  sudo systemctl daemon-reload"
        log_info "  sudo systemctl enable frps"
        log_info "  sudo systemctl start frps"
    fi
    
    log_success "服务端配置完成"
    log_info "使用 './start-frps.sh' 启动服务端"
}

# 创建防火墙配置脚本
create_firewall_script() {
    cat > setup-firewall.sh << 'EOF'
#!/bin/bash
# 防火墙配置脚本

echo "配置防火墙规则..."

# Ubuntu/Debian (ufw)
if command -v ufw >/dev/null 2>&1; then
    echo "使用 ufw 配置防火墙..."
    sudo ufw allow 7000/tcp comment "FRP Server"
    sudo ufw allow 80/tcp comment "HTTP"
    sudo ufw allow 443/tcp comment "HTTPS"
    sudo ufw allow 7500/tcp comment "FRP Dashboard"
    sudo ufw allow 6000/tcp comment "SSH via FRP"
    sudo ufw --force enable
    echo "ufw 防火墙配置完成"
fi

# CentOS/RHEL (firewalld)
if command -v firewall-cmd >/dev/null 2>&1; then
    echo "使用 firewalld 配置防火墙..."
    sudo firewall-cmd --permanent --add-port=7000/tcp
    sudo firewall-cmd --permanent --add-port=80/tcp
    sudo firewall-cmd --permanent --add-port=443/tcp
    sudo firewall-cmd --permanent --add-port=7500/tcp
    sudo firewall-cmd --permanent --add-port=6000/tcp
    sudo firewall-cmd --reload
    echo "firewalld 防火墙配置完成"
fi

# 显示当前端口状态
echo "当前监听端口:"
netstat -tlnp | grep -E ':(7000|80|443|7500|6000)\s'

echo "防火墙配置完成！"
EOF
    
    chmod +x setup-firewall.sh
    log_info "创建了防火墙配置脚本: setup-firewall.sh"
}

# 显示使用说明
show_usage() {
    echo "Baby Hearts FRP 部署脚本"
    echo ""
    echo "用法: $0 [client|server|both]"
    echo ""
    echo "选项:"
    echo "  client  - 仅安装客户端"
    echo "  server  - 仅安装服务端"
    echo "  both    - 安装客户端和服务端"
    echo ""
    echo "示例:"
    echo "  $0 client   # 在本地机器安装客户端"
    echo "  $0 server   # 在服务器安装服务端"
    echo "  $0 both     # 安装完整环境"
}

# 主函数
main() {
    log_info "Baby Hearts FRP 部署脚本启动"
    
    if [[ $# -eq 0 ]]; then
        show_usage
        exit 1
    fi
    
    detect_os
    detect_arch
    
    case "$1" in
        "client")
            download_frp
            install_client
            ;;
        "server")
            download_frp
            install_server
            create_firewall_script
            ;;
        "both")
            download_frp
            install_client
            install_server
            create_firewall_script
            ;;
        *)
            log_error "无效的选项: $1"
            show_usage
            exit 1
            ;;
    esac
    
    log_success "部署完成！"
    
    echo ""
    echo "=========================="
    echo "🎉 Baby Hearts FRP 部署完成"
    echo "=========================="
    echo ""
    echo "📋 配置信息:"
    echo "  服务器地址: 111.230.110.95"
    echo "  服务器端口: 7000"
    echo "  认证Token: babyhearts_2024"
    echo ""
    echo "🌐 访问地址:"
    echo "  Web应用: http://babyhearts.example.com (需要配置域名)"
    echo "  或使用IP: http://111.230.110.95:5173"
    echo "  Dashboard: http://111.230.110.95:7500"
    echo ""
    echo "🔧 下一步操作:"
    if [[ "$1" == "server" ]] || [[ "$1" == "both" ]]; then
        echo "  1. 在服务器运行: ./start-frps.sh"
        echo "  2. 配置防火墙: ./setup-firewall.sh"
    fi
    if [[ "$1" == "client" ]] || [[ "$1" == "both" ]]; then
        echo "  3. 在本地运行: ./start-frpc.sh"
        echo "  4. 启动Baby Hearts: npm run dev"
    fi
    echo ""
}

# 执行主函数
main "$@" 