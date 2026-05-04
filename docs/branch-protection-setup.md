# Branch Protection Setup Guide

This guide explains how to set up branch protection rules to enforce lint checks before merging PRs.

## 🛡️ **Branch Protection Rules**

To ensure that lint checks are enforced before merging, you need to configure branch protection rules in your GitHub repository.

### **Required Setup Steps**

#### **1. Navigate to Branch Protection Settings**

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Click on **Branches** in the left sidebar
4. Click **Add rule** or edit existing rule for your main branches

#### **2. Configure Protection Rules**

**Target Branches:**

- `main`
- `develop`
- `qa` (if using)

**Required Settings:**

```text
✅ Require a pull request before merging
✅ Require approvals: 1 (or as per your team policy)
✅ Dismiss stale PR approvals when new commits are pushed
✅ Require review from code owners (if you have CODEOWNERS file)
✅ Require status checks to pass before merging
✅ Require branches to be up to date before merging
```

#### **3. Required Status Checks**

Add these status checks as **required** (they must pass before merge):

**Critical Checks (Must Pass):**

- `Lint and Format Check`
- `TypeScript Type Check`
- `Lint Status Check`

**Optional Checks (Recommended but not blocking):**

- `Security and Dependencies Check`

#### **4. Additional Protection Settings**

```text
✅ Require linear history (optional - prevents merge commits)
✅ Include administrators (applies rules to repo admins too)
❌ Allow force pushes (should be disabled)
❌ Allow deletions (should be disabled)
```

## 🔧 **GitHub Repository Settings**

### **Repository Settings JSON**

For automation or documentation purposes, here's the branch protection configuration:

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Lint and Format Check",
      "TypeScript Type Check",
      "Lint Status Check"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": false
}
```

### **CODEOWNERS File** (Optional but Recommended)

Create a `.github/CODEOWNERS` file to automatically request reviews:

```gitignore
# Global owners
* @your-team/backend-developers

# Database and migration files
/prisma/ @your-team/database-admins
/scripts/db-migrate.sh @your-team/database-admins

# Docker and Kubernetes configs
/Dockerfile* @your-team/devops
/k8s/ @your-team/devops
/docker-compose*.yml @your-team/devops

# Configuration files
/src/config/ @your-team/senior-developers
/.github/workflows/ @your-team/devops

# Documentation
/docs/ @your-team/tech-writers @your-team/senior-developers
```

## 🚨 **Lint Check Enforcement**

### **What Happens When Lint Fails**

1. **PR Status**: Shows as ❌ failed
2. **Merge Button**: Disabled (grayed out)
3. **Automatic Comment**: Bot comments with detailed lint report
4. **Required Actions**: Developer must fix issues and push new commits

### **Developer Workflow When Lint Fails**

```bash
# 1. Check the PR comment for specific issues
# 2. Run lint locally to see detailed errors
npm run lint

# 3. Auto-fix what can be fixed
npm run lint:fix

# 4. Format code
npm run format

# 5. Manually fix remaining issues
# 6. Build and test
npm run build

# 7. Commit and push fixes
git add .
git commit -m "fix: resolve lint issues"
git push
```

### **Bypass Options** (Emergency Only)

**Admin Override:**

- Repository admins can bypass protection rules if enabled
- Should only be used in emergency situations
- Requires documentation of why bypass was necessary

**Temporary Disable:**

```bash
# Only for admins - disable temporarily
# 1. Go to Settings > Branches
# 2. Edit the protection rule
# 3. Uncheck required status checks
# 4. Merge the PR
# 5. Re-enable protection rules immediately
```

## 📊 **Monitoring and Reports**

### **GitHub Insights**

Monitor lint check effectiveness:

1. Go to **Insights** tab
2. Click on **Actions** to see workflow success rates
3. Monitor **Pull requests** for merge compliance

### **Webhook Integration** (Optional)

Set up webhooks to track lint failures:

```json
{
  "url": "https://your-monitoring-system.com/webhook",
  "events": ["pull_request", "check_run", "status"]
}
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Status Check Not Appearing**

```bash
# Check if workflow file is correct
.github/workflows/lint-check.yml

# Verify workflow triggers
on:
  pull_request:
    branches: [main, develop, qa]
```

#### **Status Check Always Pending**

- Workflow may be stuck or not running
- Check GitHub Actions tab for workflow status
- Verify permissions and runner availability

#### **False Positive Failures**

- Check if lint rules are too strict
- Review ESLint configuration
- Consider adjusting rules in `.eslintrc` files

### **Emergency Procedures**

#### **Critical Hotfix Deployment**

1. Create hotfix branch from main
2. Apply minimal necessary changes
3. If lint blocks critical fix:
   - Fix lint issues if possible
   - Document why bypass is needed
   - Get approval from tech lead
   - Temporarily disable protection (admin only)
   - Merge and immediately re-enable protection

#### **Lint Rule Updates**

1. Update lint rules in separate PR
2. Test impact on existing codebase
3. Provide migration guide for team
4. Update documentation
5. Merge with team consensus

## 📝 **Team Guidelines**

### **Pre-PR Checklist**

```markdown
- [ ] Run `npm run lint` locally
- [ ] Run `npm run format` to format code
- [ ] Run `npm run build` to check compilation
- [ ] Run tests: `npm test`
- [ ] Review your own changes
- [ ] Add appropriate documentation
```

### **Code Review Focus**

When lint checks pass, reviewers can focus on:

- Logic and algorithm correctness
- Architecture and design patterns
- Performance implications
- Security considerations
- Business logic validation
- Documentation completeness

---

**Remember**: Lint checks are there to maintain code quality and consistency. They help catch issues early and ensure a maintainable codebase for the entire team!
