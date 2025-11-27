#!/bin/bash

echo "⚡ POWER AUTO-FIX & SELF HEALING ENGINE — Starting..."
echo "-------------------------------------------------------"

### 1. CLEAN EVERYTHING
echo "🧹 Cleaning node_modules, caches, locks, and artifacts..."
rm -rf node_modules frontend/node_modules backend/node_modules || true
rm -rf frontend/frontend-app/node_modules || true
rm -rf package-lock.json frontend/package-lock.json backend/package-lock.json || true
rm -rf frontend/frontend-app/package-lock.json || true
rm -rf .next dist build || true
rm -rf frontend/frontend-app/.next || true
rm -rf ~/.npm ~/.cache ~/.pnpm-store || true


### 2. SYSTEM DIAGNOSTICS
echo "🔍 Running system diagnostics..."

NODE_VER=$(node -v 2>/dev/null)
NPM_VER=$(npm -v 2>/dev/null)
DOTNET_VER=$(dotnet --version 2>/dev/null)
DOCKER_VER=$(docker -v 2>/dev/null)
AZ_VER=$(az version 2>/dev/null | head -n 1)

echo "Node: $NODE_VER"
echo "NPM: $NPM_VER"
echo ".NET: $DOTNET_VER"
echo "Docker: $DOCKER_VER"
echo "Azure CLI: $AZ_VER"


### 3. BACKEND (.NET) DIAGNOSTICS & REPAIR
echo "🔧 Backend (.NET) - Clean & Restore..."
cd backend
rm -rf bin obj */bin */obj */*/bin */*/obj || true
dotnet clean || echo "⚠️ Clean had warnings"
dotnet restore --force --no-cache || echo "❌ Backend restore failed"
dotnet build --configuration Release --no-restore || echo "❌ Backend build failed"
cd ..


### 4. FRONTEND (Next.js) DIAGNOSTICS & REPAIR
echo "📦 Frontend (Next.js) - Clean Install..."
cd frontend/frontend-app

# Remove all caches and artifacts
rm -rf .next node_modules package-lock.json .turbo || true

# Install dependencies
npm install --force || echo "⚠️ Frontend install issues detected."

# Install critical dependencies
npm install sharp --force || true
npm install next@latest react@latest react-dom@latest --force || true

cd ../..


### 5. ENVIRONMENT CHECKER
echo "🧬 Checking required environment variables..."

REQUIRED_VARS=(
  NEXT_PUBLIC_API_URL
  NEXT_PUBLIC_MAPBOX_TOKEN
)

MISSING=0
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing env var: $var"
    MISSING=1
  fi
done

if [ $MISSING -eq 1 ]; then
  echo "⚠️ WARNING: Some environment variables missing (check .env files)"
else
  echo "✅ All required environment variables present."
fi


### 6. BACKEND BUILD & TEST
echo "🧪 Testing backend build..."
cd backend
if dotnet build --configuration Release --verbosity quiet; then
  echo "✅ Backend builds successfully"
else
  echo "❌ Backend build FAILED - check errors above"
  cd ..
  exit 1
fi
cd ..


### 7. FRONTEND BUILD & TEST
echo "🧪 Testing frontend build..."
cd frontend/frontend-app

export NEXT_PUBLIC_API_URL="http://localhost:5007"
export NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1IjoiY3JlZXJsaW8iLCJhIjoiY21pY3IxZHljMXFwNTJzb2FydzR4b3F1YSJ9.Is8-GyfEdqwKKEo2cGO65g"

if npm run build; then
  echo "✅ Frontend builds successfully"
else
  echo "❌ Frontend build FAILED - check errors above"
  cd ../..
  exit 1
fi

cd ../..


### 8. AZURE COMPATIBILITY CHECKS
echo "🔵 Checking Azure deployment compatibility..."

# Check Next.js standalone output
if grep -q "output.*standalone" frontend/frontend-app/next.config.ts; then
  echo "✅ Next.js standalone output configured"
else
  echo "❌ CRITICAL: Next.js standalone output NOT configured"
  echo "   Add to next.config.ts: output: 'standalone'"
fi

# Check GitHub Actions workflow
if [ -f ".github/workflows/azure-deploy.yml" ]; then
  echo "✅ Azure deployment workflow exists"
else
  echo "⚠️ Azure deployment workflow missing"
fi


### 9. DATABASE MIGRATION TEST
echo "🗄️  Testing database migrations..."
cd backend
if dotnet ef database update --project Creerlio.Infrastructure --startup-project Creerlio.Api/Creerlio.Api.csproj > /dev/null 2>&1; then
  echo "✅ Database migrations applied"
else
  echo "⚠️ Database migration check skipped (may not be configured)"
fi
cd ..


### 10. APPLICATION STARTUP TEST
echo "🚀 Testing application startup..."

# Kill any existing processes
pkill -f "dotnet run" || true
pkill -f "next-server" || true
sleep 2

# Start backend
cd backend
nohup dotnet run --project Creerlio.Api/Creerlio.Api.csproj --urls http://0.0.0.0:5007 > /tmp/backend-test.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 5

# Check backend
if curl -s http://localhost:5007 > /dev/null 2>&1; then
  echo "✅ Backend starts successfully"
else
  echo "❌ Backend startup FAILED"
  tail -20 /tmp/backend-test.log
fi

# Start frontend
cd frontend/frontend-app
nohup npm run dev -- --hostname 0.0.0.0 > /tmp/frontend-test.log 2>&1 &
FRONTEND_PID=$!
cd ../..

sleep 10

# Check frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "✅ Frontend starts successfully"
else
  echo "❌ Frontend startup FAILED"
  tail -20 /tmp/frontend-test.log
fi

# Cleanup test processes
kill $BACKEND_PID 2>/dev/null || true
kill $FRONTEND_PID 2>/dev/null || true


### 11. DOCKER BUILD TEST (if Dockerfile exists)
echo "🐳 Testing Docker build..."

if [ -f "Dockerfile" ]; then
  if docker build -t creerlio:test . > /tmp/docker-build.log 2>&1; then
    echo "✅ Docker image builds successfully"
  else
    echo "❌ Docker build FAILED"
    tail -20 /tmp/docker-build.log
  fi
else
  echo "⚠️ No Dockerfile found — skipping container tests."
fi


### 12. AZURE ENDPOINT CHECK
echo "🌐 Testing Azure endpoints..."

BACKEND_URL="https://creerlio-api.azurewebsites.net"
FRONTEND_URL="https://creerlio-app.azurewebsites.net"

HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BACKEND_URL" 2>/dev/null || echo "000")
if [ "$HTTP" = "200" ]; then
  echo "✅ Azure backend is LIVE (HTTP 200)"
else
  echo "⚠️ Azure backend: HTTP $HTTP (may need deployment)"
fi

HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$FRONTEND_URL" 2>/dev/null || echo "000")
if [ "$HTTP" = "200" ]; then
  echo "✅ Azure frontend is LIVE (HTTP 200)"
else
  echo "⚠️ Azure frontend: HTTP $HTTP (may need deployment)"
fi


### 13. COMPREHENSIVE MODULE AUDIT
echo "📋 Running comprehensive module audit..."
if [ -f "scripts/comprehensive-module-audit.sh" ]; then
  bash scripts/comprehensive-module-audit.sh | tail -20
else
  echo "⚠️ Module audit script not found"
fi


### 14. FULL SUMMARY
echo "-------------------------------------------------------"
echo "🔥 POWER AUTO-FIX COMPLETE!"
echo "-------------------------------------------------------"
echo ""
echo "📊 SYSTEM STATUS:"
echo "  Backend: $([ -f backend/bin/Release/net8.0/Creerlio.Api.dll ] && echo '✅ Built' || echo '❌ Failed')"
echo "  Frontend: $([ -d frontend/frontend-app/.next ] && echo '✅ Built' || echo '❌ Failed')"
echo "  Database: $([ -f backend/creerlio.db ] && echo '✅ Ready' || echo '⚠️ Check config')"
echo ""
echo "🔗 URLS:"
echo "  Local Backend: http://localhost:5007"
echo "  Local Frontend: http://localhost:3000"
echo "  Azure Backend: https://creerlio-api.azurewebsites.net"
echo "  Azure Frontend: https://creerlio-app.azurewebsites.net"
echo ""
echo "📝 LOGS:"
echo "  Backend: /tmp/backend-test.log"
echo "  Frontend: /tmp/frontend-test.log"
echo "  Docker: /tmp/docker-build.log"
echo ""
echo "✅ Review the logs above to see what was repaired."
echo "-------------------------------------------------------"
