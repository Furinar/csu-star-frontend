#!/bin/bash
set -euo pipefail

# 用法：
# SERVER="root@1.2.3.4" APP_DIR="/var/www/csu-star-frontend" ./deploy.sh
# 默认值可按需修改。

SERVER="${SERVER:-root@43.136.124.121}"
APP_DIR="${APP_DIR:-/var/www/html/csustar.wiki}"
APP_NAME="${APP_NAME:-csu-star-frontend}"
PORT="${PORT:-3000}"
NPM_REGISTRY="${NPM_REGISTRY:-https://mirrors.cloud.tencent.com/npm/}"
NODE_MIRROR="${NODE_MIRROR:-https://mirrors.cloud.tencent.com/nodejs-release/}"
NGINX_SERVER_NAMES="${NGINX_SERVER_NAMES:-csustar.wiki 43.136.124.121 _}"
CONFIGURE_NGINX="${CONFIGURE_NGINX:-true}"

echo "==> 同步代码到 $SERVER:$APP_DIR ..."
ssh "$SERVER" "mkdir -p '$APP_DIR'"
rsync -az --delete \
	--exclude '.git' \
	--exclude 'node_modules' \
	--exclude '.next' \
	--exclude 'out' \
	--exclude '.env.local' \
	./ "$SERVER:$APP_DIR/"

echo "==> 远端安装依赖并构建..."
ssh "$SERVER" "APP_DIR='$APP_DIR' APP_NAME='$APP_NAME' PORT='$PORT' NPM_REGISTRY='$NPM_REGISTRY' NODE_MIRROR='$NODE_MIRROR' NGINX_SERVER_NAMES='$NGINX_SERVER_NAMES' CONFIGURE_NGINX='$CONFIGURE_NGINX' bash -s" <<'REMOTE_SCRIPT'
set -e
export DEBIAN_FRONTEND=noninteractive
export npm_config_registry="$NPM_REGISTRY"
cd "$APP_DIR"

echo "[1/6] 检查 Node 环境..."

if ! command -v node >/dev/null 2>&1; then
	if command -v apt-get >/dev/null 2>&1; then
		apt-get update -y
		apt-get install -yq nodejs npm
	elif command -v yum >/dev/null 2>&1; then
		yum install -y nodejs npm
	else
		echo "[ERROR] 无法自动安装 Node.js（未检测到 apt-get/yum）。"
		exit 1
	fi
fi

NODE_MAJOR=$(node -v 2>/dev/null | sed -E "s/^v([0-9]+).*/\1/")
if [ -z "$NODE_MAJOR" ] || [ "$NODE_MAJOR" -lt 20 ]; then
	echo "[2/6] 升级 Node 到 20.x（当前: ${NODE_MAJOR:-none}）..."
	if ! command -v npm >/dev/null 2>&1; then
		if command -v apt-get >/dev/null 2>&1; then
			apt-get update -y
			apt-get install -yq npm
		elif command -v yum >/dev/null 2>&1; then
			yum install -y npm
		fi
	fi
	if ! command -v npm >/dev/null 2>&1; then
		echo "[ERROR] 缺少 npm，无法通过腾讯镜像升级 Node。"
		exit 1
	fi
	npm i -g n --registry "$NPM_REGISTRY"
	N_NODE_MIRROR="$NODE_MIRROR" n 20
	hash -r
fi

echo "[INFO] Node 版本: $(node -v)"

if ! command -v pnpm >/dev/null 2>&1; then
	echo "[3/6] 安装 pnpm..."
	if ! command -v npm >/dev/null 2>&1; then
		echo "[ERROR] 服务器未安装 npm，无法安装 pnpm。"
		exit 1
	fi
	npm i -g pnpm --registry "$NPM_REGISTRY"
fi

echo "[INFO] pnpm 版本: $(pnpm -v)"
pnpm config set registry "$NPM_REGISTRY"
npm config set registry "$NPM_REGISTRY"

echo "[4/6] 安装依赖..."

pnpm install --frozen-lockfile

echo "[5/6] 构建应用..."
pnpm build

if ! command -v pm2 >/dev/null 2>&1; then
	echo "[6/6] 安装 PM2..."
	npm i -g pm2 --registry "$NPM_REGISTRY"
fi

echo "[6/6] 启动/重载 PM2 进程: $APP_NAME"
pm2 startOrReload ecosystem.config.cjs --only "$APP_NAME" --env production

pm2 save

if [ "$CONFIGURE_NGINX" = "true" ] && command -v nginx >/dev/null 2>&1; then
	echo "[Nginx] 写入反向代理配置..."
	cat >/etc/nginx/sites-available/csustar <<NGINX_CONF
server {
	listen 80 default_server;
	listen [::]:80 default_server;
	server_name $NGINX_SERVER_NAMES;

	location / {
		proxy_pass http://127.0.0.1:$PORT;
		proxy_http_version 1.1;
		proxy_set_header Host \$host;
		proxy_set_header X-Real-IP \$remote_addr;
		proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto \$scheme;
		proxy_set_header Upgrade \$http_upgrade;
		proxy_set_header Connection "upgrade";
		proxy_cache_bypass \$http_upgrade;
	}

	location /_next/static/ {
		proxy_pass http://127.0.0.1:$PORT;
		expires 30d;
		add_header Cache-Control "public, max-age=2592000, immutable";
	}
}
NGINX_CONF

	ln -sf /etc/nginx/sites-available/csustar /etc/nginx/sites-enabled/csustar
	if [ -f /etc/nginx/conf.d/next-static.conf ]; then
		mv /etc/nginx/conf.d/next-static.conf /etc/nginx/conf.d/next-static.conf.disabled
	fi

	nginx -t
	systemctl reload nginx
	echo "[Nginx] 已重载，server_name: $NGINX_SERVER_NAMES"
fi
REMOTE_SCRIPT

echo "==> 部署完成。请确认 Nginx 已反代到 127.0.0.1:$PORT"
