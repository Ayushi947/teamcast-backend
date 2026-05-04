# Database Migration Quick Reference

Quick commands and troubleshooting for the Teamcast backend migration system.

## 🚀 **Common Commands**

### **Development**

```bash
# Start with fresh database
npm run db:reset

# Apply latest migrations
npm run db:migrate

# Check migration status
npm run db:status

# Create new migration (after schema changes)
npm run migrate:dev

# Start development server
npm run dev
```

### **QA Environment**

```bash
# Start QA environment locally
npm run docker:qa:build

# QA migrations in Kubernetes
kubectl apply -f k8s/qa/migration-job.yaml

# Check QA migration logs
kubectl logs -n teamcast-qa job/teamcast-qa-migration

# Test QA application
curl http://localhost:4301/api/monitoring/health
```

### **Production/Staging**

```bash
# Build migration container
docker build -f Dockerfile.migration -t teamcast-migration .

# Run migrations in Kubernetes
kubectl apply -f k8s/migration-job.yaml

# Check migration logs
kubectl logs -n teamcast job/teamcast-migration

# Deploy application (after migrations)
kubectl apply -f k8s/deployment.yaml
```

## 🔧 **Troubleshooting**

### **Schema Validation Fails**

```bash
# Check for syntax errors
npm run db:validate

# View detailed error
npx prisma validate --schema=./prisma/schema
```

### **Migration Fails**

```bash
# Check current status
npm run db:status

# View migration history
npx prisma migrate status

# Force reset (development only!)
npm run db:reset
```

### **Application Won't Start**

```bash
# Check if migrations are applied
npm run db:status

# Regenerate Prisma client
npm run generate

# Check database connectivity
npx prisma db push --accept-data-loss --dry-run
```

### **Docker Migration Issues**

```bash
# Test migration locally
docker run --rm \
  -e DATABASE_URL="your-db-url" \
  -e NODE_ENV="production" \
  teamcast-migration:latest \
  ./scripts/db-migrate.sh --status

# Run migration with logs
docker run --rm \
  -e DATABASE_URL="your-db-url" \
  -e NODE_ENV="production" \
  teamcast-migration:latest
```

## 📋 **Checklists**

### **Creating New Migration**

- [ ] Make schema changes in `prisma/schema/`
- [ ] Run `npm run migrate:dev`
- [ ] Test migration locally
- [ ] Commit migration files
- [ ] Create PR with migration validation
- [ ] Test in staging environment

### **Production Deployment**

- [ ] Backup production database
- [ ] Review migration in staging
- [ ] Run migration job in production
- [ ] Verify migration status
- [ ] Deploy application
- [ ] Verify application health

### **Rollback Procedure**

- [ ] Stop application (`kubectl scale deployment teamcast-backend --replicas=0`)
- [ ] Restore database from backup
- [ ] Deploy previous application version
- [ ] Scale up application
- [ ] Verify functionality

## 🔍 **Status Checks**

### **Migration Status Commands**

```bash
# Basic status
npm run db:status

# Detailed status
npx prisma migrate status

# Schema validation
npm run db:validate

# Kubernetes migration logs
kubectl logs -n teamcast job/teamcast-migration -f
```

### **Health Checks**

```bash
# Application health
curl http://localhost:4300/api/monitoring/health

# Database connectivity
npx prisma db push --accept-data-loss --dry-run

# Prisma client status
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => console.log('Connected')).catch(console.error)"
```

## 🆘 **Emergency Procedures**

### **Migration Stuck in Production**

1. Check migration job logs
2. Scale down application
3. Kill migration job if needed
4. Restore from backup
5. Contact team for assistance

### **Application Down After Migration**

1. Check application logs
2. Verify migration status
3. Check database connectivity
4. Regenerate Prisma client if needed
5. Consider rollback if critical

### **Schema Drift Detected**

1. Don't panic - this is recoverable
2. Check what caused the drift
3. Create corrective migration
4. Test in staging first
5. Apply to production

## 📞 **Support Contacts**

- **Migration Issues**: Check GitHub Actions logs first
- **Database Problems**: Review migration documentation
- **Emergency**: Follow rollback procedures
- **Questions**: Create GitHub issue with logs

---

**Remember**: When in doubt, check the logs and refer to the full [Database Migrations Guide](./database-migrations.md)!
