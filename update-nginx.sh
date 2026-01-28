#!/bin/bash
# 更新nginx配置脚本
# 用法: ./update-nginx.sh

set -e

echo "📋 复制nginx配置文件..."
sudo cp /home/ubuntu/github/lottery/nginx-lottery.conf /etc/nginx/sites-available/xumin.fun

echo "🔍 测试nginx配置..."
sudo nginx -t

echo "🔄 重载nginx..."
sudo systemctl reload nginx

echo "✅ 完成! 访问地址: https://xumin.fun/game"
