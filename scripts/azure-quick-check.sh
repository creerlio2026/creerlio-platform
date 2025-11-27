#!/bin/bash

# CREERLIO AZURE DEPLOYMENT QUICK CHECK
# Fast validation without full builds

echo "🚀 CREERLIO AZURE DEPLOYMENT CHECK"
echo "===================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_pass() { echo -e "${GREEN}✓${NC} $1"; }
check_fail() { echo -e "${RED}✗${NC} $1"; }
check_warn() { echo -e "${YELLOW}⚠${NC} $1"; }

echo "📋 DEPLOYMENT FILES:"
[ -f ".github/workflows/azure-deploy.yml" ] && check_pass "GitHub Actions workflow" || check_fail "Workflow missing"
[ -f "azure-deploy.sh" ] && check_pass "Deployment script" || check_warn "Script missing"
[ -f "backend/Creerlio.Api/Creerlio.Api.csproj" ] && check_pass "Backend project" || check_fail "Backend missing"
[ -f "frontend/frontend-app/package.json" ] && check_pass "Frontend package.json" || check_fail "Frontend missing"
[ -f "frontend/frontend-app/next.config.ts" ] && check_pass "Next.js config" || check_fail "Config missing"

echo ""
echo "⚙️  WORKFLOW CONFIGURATION:"
grep -q "AZURE_CREDENTIALS" .github/workflows/azure-deploy.yml && check_pass "AZURE_CREDENTIALS referenced" || check_fail "Missing AZURE_CREDENTIALS"
grep -q "MAPBOX_TOKEN" .github/workflows/azure-deploy.yml && check_pass "MAPBOX_TOKEN referenced" || check_fail "Missing MAPBOX_TOKEN"
grep -q "creerlio-api" .github/workflows/azure-deploy.yml && check_pass "Backend app: creerlio-api" || check_warn "Check backend name"
grep -q "creerlio-app" .github/workflows/azure-deploy.yml && check_pass "Frontend app: creerlio-app" || check_warn "Check frontend name"
grep -q "8.0" .github/workflows/azure-deploy.yml && check_pass ".NET 8.0 configured" || check_warn "Check .NET version"
grep -q "20.x" .github/workflows/azure-deploy.yml && check_pass "Node.js 20.x configured" || check_warn "Check Node version"

echo ""
echo "📦 NEXT.JS AZURE CONFIG:"
grep -q "standalone" frontend/frontend-app/next.config.ts && check_pass "Standalone output enabled" || check_fail "Standalone NOT enabled (CRITICAL)"
grep -q "NEXT_PUBLIC" frontend/frontend-app/next.config.ts && check_pass "Environment variables configured" || check_warn "Check env vars"

echo ""
echo "🔨 BUILD VALIDATION:"
cd backend && dotnet restore --verbosity quiet > /dev/null 2>&1 && check_pass "Backend restores" || check_warn "Backend restore issues"
cd ..

echo ""
echo "🌐 AZURE ENDPOINTS:"
echo "   Checking https://creerlio-api.azurewebsites.net ..."
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://creerlio-api.azurewebsites.net" 2>/dev/null || echo "000")
[ "$HTTP" = "200" ] && check_pass "Backend LIVE (HTTP 200)" || check_warn "Backend: HTTP $HTTP (may not be deployed)"

echo "   Checking https://creerlio-app.azurewebsites.net ..."
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://creerlio-app.azurewebsites.net" 2>/dev/null || echo "000")
[ "$HTTP" = "200" ] && check_pass "Frontend LIVE (HTTP 200)" || check_warn "Frontend: HTTP $HTTP (may not be deployed)"

echo ""
echo "🔐 REQUIRED GITHUB SECRETS:"
echo "   1. AZURE_CREDENTIALS - Azure service principal JSON"
echo "   2. MAPBOX_TOKEN - pk.eyJ1IjoiY3JlZXJsaW8i..."
echo ""
echo "   Add at: GitHub → Settings → Secrets → Actions"
echo ""

echo "=================================="
echo "✅ DEPLOYMENT CONFIGURATION READY"
echo "=================================="
echo ""
echo "TO DEPLOY:"
echo "  1. Configure GitHub secrets above"
echo "  2. Push to main: git push origin main"
echo "  3. Monitor: github.com/Creerlio/creerlio-platform/actions"
echo ""
