#!/bin/bash

# CREERLIO AZURE DEPLOYMENT VALIDATION & TEST SCRIPT
# Checks Azure deployment configuration and runs validation tests

set -e

echo "🔍 CREERLIO AZURE DEPLOYMENT VALIDATION"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++))
}

# ==========================================
# 1. CHECK REQUIRED FILES EXIST
# ==========================================
echo "📁 1. CHECKING DEPLOYMENT FILES"
echo "-------------------------------"

if [ -f ".github/workflows/azure-deploy.yml" ]; then
    check_pass "GitHub Actions workflow exists"
else
    check_fail "GitHub Actions workflow missing"
fi

if [ -f "azure-deploy.sh" ]; then
    check_pass "Azure deployment script exists"
else
    check_warn "Azure deployment script missing"
fi

if [ -f "backend/Creerlio.Api/Creerlio.Api.csproj" ]; then
    check_pass "Backend project file exists"
else
    check_fail "Backend project file missing"
fi

if [ -f "frontend/frontend-app/package.json" ]; then
    check_pass "Frontend package.json exists"
else
    check_fail "Frontend package.json missing"
fi

if [ -f "frontend/frontend-app/next.config.ts" ]; then
    check_pass "Next.js config exists"
else
    check_fail "Next.js config missing"
fi

echo ""

# ==========================================
# 2. VALIDATE WORKFLOW CONFIGURATION
# ==========================================
echo "⚙️  2. VALIDATING WORKFLOW CONFIGURATION"
echo "----------------------------------------"

# Check for required secrets
if grep -q "AZURE_CREDENTIALS" .github/workflows/azure-deploy.yml; then
    check_pass "AZURE_CREDENTIALS secret referenced"
else
    check_fail "AZURE_CREDENTIALS secret not found"
fi

if grep -q "MAPBOX_TOKEN" .github/workflows/azure-deploy.yml; then
    check_pass "MAPBOX_TOKEN secret referenced"
else
    check_fail "MAPBOX_TOKEN secret not found"
fi

# Check app names
if grep -q "AZURE_BACKEND_APP_NAME: creerlio-api" .github/workflows/azure-deploy.yml; then
    check_pass "Backend app name configured: creerlio-api"
else
    check_warn "Backend app name may need configuration"
fi

if grep -q "AZURE_FRONTEND_APP_NAME: creerlio-app" .github/workflows/azure-deploy.yml; then
    check_pass "Frontend app name configured: creerlio-app"
else
    check_warn "Frontend app name may need configuration"
fi

# Check .NET version
if grep -q "DOTNET_VERSION: '8.0.x'" .github/workflows/azure-deploy.yml; then
    check_pass ".NET 8.0 configured"
else
    check_warn ".NET version may need update"
fi

# Check Node version
if grep -q "NODE_VERSION: '20.x'" .github/workflows/azure-deploy.yml; then
    check_pass "Node.js 20.x configured"
else
    check_warn "Node.js version may need update"
fi

echo ""

# ==========================================
# 3. CHECK NEXT.JS STANDALONE CONFIGURATION
# ==========================================
echo "📦 3. CHECKING NEXT.JS DEPLOYMENT CONFIG"
echo "----------------------------------------"

if grep -q "output.*standalone" frontend/frontend-app/next.config.ts; then
    check_pass "Next.js standalone output configured"
else
    check_fail "Next.js standalone output NOT configured (required for Azure)"
fi

if grep -q "NEXT_PUBLIC_API_URL" frontend/frontend-app/next.config.ts || grep -q "NEXT_PUBLIC_API_URL" .github/workflows/azure-deploy.yml; then
    check_pass "API URL environment variable configured"
else
    check_warn "API URL environment variable may need configuration"
fi

if grep -q "NEXT_PUBLIC_MAPBOX_TOKEN" frontend/frontend-app/next.config.ts || grep -q "NEXT_PUBLIC_MAPBOX_TOKEN" .github/workflows/azure-deploy.yml; then
    check_pass "Mapbox token environment variable configured"
else
    check_warn "Mapbox token environment variable may need configuration"
fi

echo ""

# ==========================================
# 4. VALIDATE BACKEND BUILD
# ==========================================
echo "🔨 4. VALIDATING BACKEND BUILD"
echo "------------------------------"

cd backend

if dotnet restore > /dev/null 2>&1; then
    check_pass "Backend packages restore successfully"
else
    check_fail "Backend packages failed to restore"
fi

if dotnet build --configuration Release > /dev/null 2>&1; then
    check_pass "Backend builds successfully (Release mode)"
else
    check_fail "Backend build failed"
fi

cd ..

echo ""

# ==========================================
# 5. VALIDATE FRONTEND BUILD
# ==========================================
echo "🎨 5. VALIDATING FRONTEND BUILD"
echo "-------------------------------"

cd frontend/frontend-app

if [ -f "package-lock.json" ]; then
    check_pass "package-lock.json exists"
else
    check_warn "package-lock.json missing (npm ci may fail)"
fi

# Check if node_modules exists or needs install
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    if npm install > /dev/null 2>&1; then
        check_pass "Frontend dependencies installed"
    else
        check_fail "Frontend npm install failed"
    fi
else
    check_pass "Frontend node_modules exists"
fi

# Test build
echo "   Testing build (this may take a minute)..."
if npm run build > /tmp/frontend-build.log 2>&1; then
    check_pass "Frontend builds successfully"
else
    check_fail "Frontend build failed (see /tmp/frontend-build.log)"
    echo "   Last 10 lines of build log:"
    tail -10 /tmp/frontend-build.log
fi

# Check if standalone output was created
if [ -d ".next/standalone" ]; then
    check_pass "Standalone output directory created"
else
    check_fail "Standalone output directory NOT created"
fi

cd ../..

echo ""

# ==========================================
# 6. CHECK AZURE ENDPOINTS (if deployed)
# ==========================================
echo "🌐 6. CHECKING AZURE ENDPOINTS"
echo "------------------------------"

BACKEND_URL="https://creerlio-api.azurewebsites.net"
FRONTEND_URL="https://creerlio-app.azurewebsites.net"

echo "   Testing backend: $BACKEND_URL"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BACKEND_URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    check_pass "Backend is live and responding (HTTP 200)"
elif [ "$HTTP_CODE" = "000" ]; then
    check_warn "Backend not reachable (may not be deployed yet)"
else
    check_warn "Backend responded with HTTP $HTTP_CODE"
fi

echo "   Testing frontend: $FRONTEND_URL"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$FRONTEND_URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    check_pass "Frontend is live and responding (HTTP 200)"
elif [ "$HTTP_CODE" = "000" ]; then
    check_warn "Frontend not reachable (may not be deployed yet)"
else
    check_warn "Frontend responded with HTTP $HTTP_CODE"
fi

echo ""

# ==========================================
# 7. GITHUB SECRETS CHECK
# ==========================================
echo "🔐 7. REQUIRED GITHUB SECRETS"
echo "-----------------------------"

echo -e "${YELLOW}⚠${NC} The following secrets must be configured in GitHub:"
echo ""
echo "   1. AZURE_CREDENTIALS - Azure service principal JSON"
echo "      Get this by running:"
echo "      az ad sp create-for-rbac --name creerlio-github --role contributor \\"
echo "        --scopes /subscriptions/{subscription-id}/resourceGroups/creerlio-platform-rg \\"
echo "        --sdk-auth"
echo ""
echo "   2. MAPBOX_TOKEN - Your Mapbox access token"
echo "      Current token starts with: pk.eyJ1IjoiY3JlZXJsaW8i..."
echo ""
echo "   To add secrets:"
echo "   GitHub → Settings → Secrets and variables → Actions → New repository secret"
echo ""

# ==========================================
# 8. DEPLOYMENT INSTRUCTIONS
# ==========================================
echo "📋 8. DEPLOYMENT INSTRUCTIONS"
echo "-----------------------------"
echo ""
echo "To deploy to Azure:"
echo ""
echo "  Option A - GitHub Actions (Recommended):"
echo "    1. Configure GitHub secrets (AZURE_CREDENTIALS, MAPBOX_TOKEN)"
echo "    2. Push to main branch: git push origin main"
echo "    3. GitHub Actions will automatically deploy"
echo ""
echo "  Option B - Manual Azure CLI:"
echo "    1. Install Azure CLI: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
echo "    2. Login: az login"
echo "    3. Run deployment script: bash azure-deploy.sh"
echo ""
echo "  Option C - Test Deployment:"
echo "    1. Build backend: cd backend && dotnet publish -c Release -o publish"
echo "    2. Build frontend: cd frontend/frontend-app && npm run build"
echo "    3. Use GitHub Actions to deploy built artifacts"
echo ""

# ==========================================
# SUMMARY
# ==========================================
echo "=========================================="
echo "📊 VALIDATION SUMMARY"
echo "=========================================="
echo -e "${GREEN}PASSED: $PASS${NC}"
echo -e "${YELLOW}WARNINGS: $WARN${NC}"
echo -e "${RED}FAILED: $FAIL${NC}"
echo ""

TOTAL=$((PASS + WARN + FAIL))
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$(( PASS * 100 / TOTAL ))
    echo "Success Rate: $SUCCESS_RATE%"
fi
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ Azure deployment configuration is READY${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Configure GitHub secrets (AZURE_CREDENTIALS, MAPBOX_TOKEN)"
    echo "  2. Push to main branch to trigger deployment"
    echo "  3. Monitor deployment at: https://github.com/Creerlio/creerlio-platform/actions"
    exit 0
else
    echo -e "${RED}❌ Azure deployment has CRITICAL issues${NC}"
    echo "Please fix the failed checks above before deploying."
    exit 1
fi
