#!/bin/bash
# Script to download APK from EAS Build and deploy to server

set -e

echo "🚀 MajaCraft Mobile APK Deployment Script"
echo "=========================================="

# EAS Build URL (replace with actual build URL from Expo dashboard)
BUILD_URL="${1:-}"

if [ -z "$BUILD_URL" ]; then
  echo "❌ Error: Build URL required"
  echo "Usage: ./deploy-apk.sh <EAS_BUILD_URL>"
  echo ""
  echo "Example:"
  echo "  ./deploy-apk.sh https://expo.dev/artifacts/eas/..."
  exit 1
fi

echo "📥 Downloading APK from EAS Build..."
wget -q --show-progress "$BUILD_URL" -O /tmp/majacraft-temp.apk

echo "✅ APK downloaded successfully"

# Move to public/downloads
echo "📦 Moving APK to public/downloads..."
mv /tmp/majacraft-temp.apk /root/Ecosystem/maja-marketplace/public/downloads/majacraft.apk

# Get APK info
APK_SIZE=$(du -h /root/Ecosystem/maja-marketplace/public/downloads/majacraft.apk | cut -f1)
echo "✅ APK deployed: ${APK_SIZE}"

echo ""
echo "🎉 Deployment complete!"
echo "📱 Download URL: https://majacraft.id/download"
echo "🔗 Direct APK: https://majacraft.id/api/mobile/download"
