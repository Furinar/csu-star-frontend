#!/bin/bash
set -e

SERVER="root@43.136.124.121"
REMOTE_PATH="/var/www/html/csustar.wiki/"

echo "==> 构建项目..."
pnpm build

echo "==> 部署到服务器 $SERVER..."
rsync -avz --delete --progress out/ "$SERVER:$REMOTE_PATH"

echo "==> 部署完成！访问 http://43.136.124.121"
