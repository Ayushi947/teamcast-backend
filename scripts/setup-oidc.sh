#!/bin/bash

###############################################################################
# OIDC Setup Script for TeamCast
#
# This script generates:
# 1. RSA key pair (2048-bit) for signing ID Tokens
# 2. Deel Client ID (UUID)
# 3. Deel Client Secret (secure random 64-character string)
#
# Usage:
#   ./scripts/setup-oidc.sh
#
# Environment:
#   - Development: Use generated values in .env
#   - Production: Generate new keys and secrets for production
###############################################################################

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
KEYS_DIR="$PROJECT_ROOT/keys"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}  TeamCast OIDC Setup Script${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

# Check if openssl is installed
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ Error: openssl is not installed${NC}"
    echo "Please install openssl first:"
    echo "  - macOS: brew install openssl"
    echo "  - Ubuntu: sudo apt-get install openssl"
    exit 1
fi

# Create keys directory if it doesn't exist
if [ ! -d "$KEYS_DIR" ]; then
    echo -e "${YELLOW}📁 Creating keys directory...${NC}"
    mkdir -p "$KEYS_DIR"
    echo -e "${GREEN}✅ Keys directory created${NC}"
else
    echo -e "${GREEN}✅ Keys directory exists${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 1: Generate RSA Key Pair${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

PRIVATE_KEY_PATH="$KEYS_DIR/oidc-private-key.pem"
PUBLIC_KEY_PATH="$KEYS_DIR/oidc-public-key.pem"

# Check if keys already exist
if [ -f "$PRIVATE_KEY_PATH" ] && [ -f "$PUBLIC_KEY_PATH" ]; then
    echo -e "${YELLOW}⚠️  RSA keys already exist!${NC}"
    echo "   Private key: $PRIVATE_KEY_PATH"
    echo "   Public key:  $PUBLIC_KEY_PATH"
    echo ""
    read -p "Do you want to regenerate them? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}📋 Keeping existing RSA keys${NC}"
        KEYS_GENERATED=false
    else
        echo -e "${YELLOW}🔄 Regenerating RSA keys...${NC}"
        KEYS_GENERATED=true
    fi
else
    KEYS_GENERATED=true
fi

if [ "$KEYS_GENERATED" = true ]; then
    echo -e "${YELLOW}🔑 Generating 2048-bit RSA private key...${NC}"
    openssl genrsa -out "$PRIVATE_KEY_PATH" 2048 2>/dev/null

    echo -e "${YELLOW}🔑 Extracting public key...${NC}"
    openssl rsa -in "$PRIVATE_KEY_PATH" -pubout -out "$PUBLIC_KEY_PATH" 2>/dev/null

    # Set secure permissions
    chmod 600 "$PRIVATE_KEY_PATH"
    chmod 644 "$PUBLIC_KEY_PATH"

    echo -e "${GREEN}✅ RSA key pair generated successfully${NC}"
    echo "   Private key: $PRIVATE_KEY_PATH (permissions: 600)"
    echo "   Public key:  $PUBLIC_KEY_PATH (permissions: 644)"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 2: Generate Deel Credentials${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Generate Deel Client ID (UUID format)
DEEL_CLIENT_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
echo -e "${GREEN}✅ Deel Client ID generated:${NC}"
echo "   $DEEL_CLIENT_ID"
echo ""

# Generate Deel Client Secret (64 random characters)
DEEL_CLIENT_SECRET=$(openssl rand -hex 32)
echo -e "${GREEN}✅ Deel Client Secret generated:${NC}"
echo "   $DEEL_CLIENT_SECRET"
echo ""

# Generate OIDC Key ID
OIDC_KEY_ID="teamcast-oidc-$(date +%Y%m%d)"
echo -e "${GREEN}✅ OIDC Key ID:${NC}"
echo "   $OIDC_KEY_ID"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Step 3: Environment Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ENV_EXAMPLE_PATH="$PROJECT_ROOT/.env.oidc.example"

cat > "$ENV_EXAMPLE_PATH" << EOF
# ============================================
# OIDC Provider Configuration
# ============================================
# The issuer URL (should match your backend URL)
# Development: https://devapi.teamcast.ai
# Production: https://api.teamcast.ai
OIDC_ISSUER=https://devapi.teamcast.ai

# Path to RSA private key for signing ID Tokens
OIDC_PRIVATE_KEY_PATH=./keys/oidc-private-key.pem

# Path to RSA public key (for JWKS endpoint)
OIDC_PUBLIC_KEY_PATH=./keys/oidc-public-key.pem

# Key ID for JWKS (identifies which key signed the token)
OIDC_KEY_ID=$OIDC_KEY_ID

# ID Token expiry in seconds (default: 3600 = 1 hour)
OIDC_TOKEN_EXPIRY=3600

# ============================================
# Deel Integration Configuration
# ============================================
# Enable/disable Deel SSO integration
DEEL_ENABLED=true

# Deel OAuth Client ID (provided by Deel OR use this generated one for testing)
DEEL_CLIENT_ID=$DEEL_CLIENT_ID

# Deel OAuth Client Secret (provided by Deel OR use this generated one for testing)
# IMPORTANT: Keep this secret! Never commit to git!
DEEL_CLIENT_SECRET=$DEEL_CLIENT_SECRET

# Deel Redirect URI (where Deel redirects after authentication)
# This should be provided by Deel
# Example: https://app.deel.com/sso/callback
DEEL_REDIRECT_URI=https://app.deel.com/sso/callback

# ============================================
# Well-known OIDC Discovery URL
# ============================================
# Your TeamCast OIDC Discovery endpoint (provide this to Deel):
# https://devapi.teamcast.ai/.well-known/openid-configuration
#
# Deel will use this to discover all other endpoints automatically
EOF

echo -e "${GREEN}✅ Environment configuration created:${NC}"
echo "   $ENV_EXAMPLE_PATH"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Setup Complete! 🎉${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}📋 Next Steps:${NC}"
echo ""
echo "1. Add these variables to your .env file:"
echo -e "   ${BLUE}cat .env.oidc.example >> .env${NC}"
echo ""
echo "2. Update OIDC_ISSUER to match your environment:"
echo "   - Development: https://devapi.teamcast.ai"
echo "   - Production:  https://api.teamcast.ai"
echo ""
echo "3. Update DEEL_REDIRECT_URI with the actual value from Deel"
echo ""
echo "4. Provide this Well-known URL to Deel:"
echo -e "   ${GREEN}https://devapi.teamcast.ai/.well-known/openid-configuration${NC}"
echo ""
echo "5. Restart your backend server:"
echo -e "   ${BLUE}npm run dev${NC}"
echo "   OR"
echo -e "   ${BLUE}pm2 restart teamcast-backend --update-env${NC}"
echo ""
echo "6. Test the OIDC endpoints:"
echo -e "   ${BLUE}curl https://devapi.teamcast.ai/.well-known/openid-configuration${NC}"
echo -e "   ${BLUE}curl https://devapi.teamcast.ai/api/v1/oidc/jwks${NC}"
echo ""

echo -e "${RED}⚠️  IMPORTANT SECURITY NOTES:${NC}"
echo "   - NEVER commit .env or private keys to git!"
echo "   - Keep DEEL_CLIENT_SECRET secure"
echo "   - Use different keys for development and production"
echo "   - Rotate keys periodically for production"
echo ""

echo -e "${GREEN}✅ OIDC setup complete!${NC}"
echo ""
