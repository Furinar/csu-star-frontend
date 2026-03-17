#!/bin/bash
set -euo pipefail

# 用法：
# SERVER="root@1.2.3.4" APP_DIR="/var/www/csu-star-frontend" ./deploy.sh
# 默认值可按需修改。

SERVER="${SERVER:-root@122.51.10.212}"
APP_DIR="${APP_DIR:-/var/www/html/csustar.wiki}"
APP_NAME="${APP_NAME:-csu-star-frontend}"
NPM_REGISTRY="${NPM_REGISTRY:-https://mirrors.cloud.tencent.com/npm/}"
NODE_MIRROR="${NODE_MIRROR:-https://mirrors.cloud.tencent.com/nodejs-release/}"
NGINX_SERVER_NAMES="${NGINX_SERVER_NAMES:-csustar.wiki www.csustar.wiki 122.51.10.212 _}"
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
ssh "$SERVER" "APP_DIR='$APP_DIR' APP_NAME='$APP_NAME' NPM_REGISTRY='$NPM_REGISTRY' NODE_MIRROR='$NODE_MIRROR' NGINX_SERVER_NAMES='$NGINX_SERVER_NAMES' CONFIGURE_NGINX='$CONFIGURE_NGINX' bash -s" <<'REMOTE_SCRIPT'
set -e
export DEBIAN_FRONTEND=noninteractive
export npm_config_registry="$NPM_REGISTRY"
cd "$APP_DIR"

echo "[1/5] 检查 Node 环境..."

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
	echo "[2/5] 升级 Node 到 20.x（当前: ${NODE_MAJOR:-none}）..."
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
	echo "[3/5] 安装 pnpm..."
	if ! command -v npm >/dev/null 2>&1; then
		echo "[ERROR] 服务器未安装 npm，无法安装 pnpm。"
		exit 1
	fi
	npm i -g pnpm --registry "$NPM_REGISTRY"
fi

echo "[INFO] pnpm 版本: $(pnpm -v)"
pnpm config set registry "$NPM_REGISTRY"
npm config set registry "$NPM_REGISTRY"

echo "[4/5] 安装依赖..."

pnpm install --frozen-lockfile

echo "[5/5] 构建静态文件..."
pnpm build
# 静态导出产物在 out/ 目录

if [ "$CONFIGURE_NGINX" = "true" ] && command -v nginx >/dev/null 2>&1; then
	echo "[Nginx] 写入静态文件托管配置..."
	cat >/etc/nginx/sites-available/csustar <<NGINX_CONF
server {
	listen 80 default_server;
	listen [::]:80 default_server;
	server_name $NGINX_SERVER_NAMES;

	root $APP_DIR/out;
	index index.html;

	location / {
		try_files \$uri \$uri/ \$uri.html /index.html;
	}

	location /_next/static/ {
		expires 30d;
		add_header Cache-Control "public, max-age=2592000, immutable";
	}

	location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
		expires 7d;
		add_header Cache-Control "public, max-age=604800";
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

echo "==> 部署完成。Nginx 直接托管 $APP_DIR/out 静态文件。"
