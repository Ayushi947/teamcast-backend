#!/bin/bash

# Pre-commit Hook Setup Script for Teamcast Backend
# This script sets up Git pre-commit hooks to run linting before commits

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "This script must be run from within a Git repository"
        exit 1
    fi
    log_info "Git repository detected"
}

# Install dependencies if needed
install_dependencies() {
    log_info "Checking dependencies..."
    
    if [ ! -d "node_modules" ]; then
        log_info "Installing Node.js dependencies..."
        npm install
    fi
    
    # Check if husky is installed
    if [ ! -d "node_modules/.bin/husky" ]; then
        log_warn "Husky not found, installing..."
        npm install --save-dev husky
    fi
    
    log_info "Dependencies are ready"
}

# Create pre-commit hook
create_pre_commit_hook() {
    log_info "Creating pre-commit hook..."
    
    # Create .husky directory if it doesn't exist
    mkdir -p .husky
    
    # Create pre-commit hook file
    cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Get list of staged TypeScript/JavaScript files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|js)$' || echo "")

if [ -z "$STAGED_FILES" ]; then
    echo "✅ No TypeScript/JavaScript files to check"
    exit 0
fi

echo "📁 Checking staged files:"
echo "$STAGED_FILES"

# Function to check if command succeeded
check_result() {
    if [ $? -ne 0 ]; then
        echo "❌ $1 failed!"
        echo "💡 Run the following commands to fix issues:"
        echo "   npm run lint:fix"
        echo "   npm run format"
        echo "   git add ."
        echo ""
        echo "Or skip the hook with: git commit --no-verify"
        exit 1
    fi
    echo "✅ $1 passed"
}

# Check TypeScript compilation
echo "🔍 Checking TypeScript compilation..."
npm run build
check_result "TypeScript compilation"

# Run ESLint on staged files
echo "🔍 Running ESLint on staged files..."
echo "$STAGED_FILES" | xargs npx eslint --ext .ts,.js
check_result "ESLint"

# Check Prettier formatting on staged files
echo "🔍 Checking Prettier formatting on staged files..."
echo "$STAGED_FILES" | xargs npx prettier --check
check_result "Prettier formatting"

# Optional: Run specific tests for changed files
# echo "🧪 Running tests for affected files..."
# npm test -- --findRelatedTests $STAGED_FILES
# check_result "Tests"

echo "🎉 All pre-commit checks passed!"
EOF

    # Make the hook executable
    chmod +x .husky/pre-commit
    
    log_info "Pre-commit hook created successfully"
}

# Create commit-msg hook for commit message linting
create_commit_msg_hook() {
    log_info "Creating commit-msg hook..."
    
    cat > .husky/commit-msg << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Checking commit message format..."

# Run commitlint
npx commitlint --edit "$1"

if [ $? -ne 0 ]; then
    echo "❌ Commit message format is invalid!"
    echo ""
    echo "💡 Commit message should follow conventional commits format:"
    echo "   feat: add new feature"
    echo "   fix: bug fix"
    echo "   docs: documentation changes"
    echo "   style: formatting changes"
    echo "   refactor: code refactoring"
    echo "   test: add tests"
    echo "   chore: maintenance tasks"
    echo ""
    echo "Examples:"
    echo "   feat: add user authentication"
    echo "   fix: resolve database connection issue"
    echo "   docs: update API documentation"
    echo ""
    exit 1
fi

echo "✅ Commit message format is valid"
EOF

    chmod +x .husky/commit-msg
    
    log_info "Commit-msg hook created successfully"
}

# Create pre-push hook for additional checks
create_pre_push_hook() {
    log_info "Creating pre-push hook..."
    
    cat > .husky/pre-push << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-push checks..."

# Run full test suite
echo "🧪 Running full test suite..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed! Push aborted."
    exit 1
fi

# Run full lint check
echo "🔍 Running full lint check..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Lint check failed! Push aborted."
    echo "💡 Run 'npm run lint:fix' to auto-fix issues"
    exit 1
fi

# Check if build is successful
echo "🏗️ Checking build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Push aborted."
    exit 1
fi

echo "✅ All pre-push checks passed!"
EOF

    chmod +x .husky/pre-push
    
    log_info "Pre-push hook created successfully"
}

# Initialize husky
initialize_husky() {
    log_info "Initializing Husky..."
    
    # Install husky
    npx husky install
    
    # Create husky directory structure
    npx husky add .husky/pre-commit "echo 'Pre-commit hook placeholder'"
    npx husky add .husky/commit-msg "echo 'Commit-msg hook placeholder'"
    npx husky add .husky/pre-push "echo 'Pre-push hook placeholder'"
    
    log_info "Husky initialized successfully"
}

# Update package.json scripts
update_package_scripts() {
    log_info "Updating package.json scripts..."
    
    # Check if prepare script exists
    if ! grep -q '"prepare"' package.json; then
        log_info "Adding prepare script to package.json"
        # This would need manual addition or use of jq/sed
        log_warn "Please manually add '\"prepare\": \"husky install\"' to your package.json scripts"
    fi
}

# Create quick setup guide
create_setup_guide() {
    log_info "Creating setup guide..."
    
    cat > docs/pre-commit-hooks.md << 'EOF'
# Pre-commit Hooks Setup Guide

This guide explains how to use the pre-commit hooks for the Teamcast backend.

## 🚀 **Quick Setup**

Run the setup script:
```bash
./scripts/setup-pre-commit.sh
```

## 🔧 **Manual Setup**

If you prefer manual setup:

```bash
# Install dependencies
npm install

# Initialize husky
npx husky install

# Set up hooks
npm run prepare
```

## 🎯 **What the Hooks Do**

### **Pre-commit Hook**
Runs before each commit:
- ✅ TypeScript compilation check
- ✅ ESLint on staged files
- ✅ Prettier formatting check
- ✅ Optional: Related tests

### **Commit-msg Hook**
Validates commit message format:
- ✅ Conventional commits format
- ✅ Proper commit types (feat, fix, docs, etc.)

### **Pre-push Hook**
Runs before pushing to remote:
- ✅ Full test suite
- ✅ Complete lint check
- ✅ Build verification

## 🔄 **Developer Workflow**

### **Normal Workflow**
```bash
# Make changes
git add .

# Commit (hooks run automatically)
git commit -m "feat: add new feature"

# Push (pre-push hooks run)
git push
```

### **If Hooks Fail**
```bash
# Fix lint issues automatically
npm run lint:fix

# Format code
npm run format

# Re-stage files
git add .

# Commit again
git commit -m "feat: add new feature"
```

### **Skip Hooks (Emergency Only)**
```bash
# Skip pre-commit hooks
git commit --no-verify -m "hotfix: emergency fix"

# Skip pre-push hooks
git push --no-verify
```

## 🛠️ **Customization**

### **Modify Hooks**
Edit files in `.husky/` directory:
- `.husky/pre-commit` - Pre-commit checks
- `.husky/commit-msg` - Commit message validation
- `.husky/pre-push` - Pre-push checks

### **Disable Specific Checks**
Comment out lines in the hook files:
```bash
# echo "🧪 Running tests..."
# npm test
```

## 🔍 **Troubleshooting**

### **Hook Not Running**
```bash
# Reinstall husky
npx husky install

# Check hook permissions
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push
```

### **Permission Denied**
```bash
# Fix permissions
chmod +x .husky/*
```

### **Hooks Running Slowly**
- Consider running only on staged files
- Reduce scope of tests in pre-commit
- Move heavy checks to pre-push only

---

**Remember**: Hooks are there to catch issues early and maintain code quality!
EOF

    log_info "Setup guide created at docs/pre-commit-hooks.md"
}

# Main function
main() {
    log_info "Setting up pre-commit hooks for Teamcast Backend..."
    
    check_git_repo
    install_dependencies
    initialize_husky
    create_pre_commit_hook
    create_commit_msg_hook
    create_pre_push_hook
    update_package_scripts
    create_setup_guide
    
    log_info "✅ Pre-commit hooks setup completed successfully!"
    echo ""
    log_info "🎉 Your repository now has the following hooks:"
    echo "   - Pre-commit: Lint and format checks on staged files"
    echo "   - Commit-msg: Conventional commit message validation"
    echo "   - Pre-push: Full test suite and build verification"
    echo ""
    log_info "💡 Next steps:"
    echo "   1. Make a test commit to verify hooks are working"
    echo "   2. Review docs/pre-commit-hooks.md for usage guide"
    echo "   3. Share this setup with your team members"
}

# Run main function
main "$@" 