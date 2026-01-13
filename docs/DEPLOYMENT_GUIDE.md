# Advanced Campaign Settings - Deployment & Production Guide

## 🚀 Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript compiles without errors
- [ ] No console.log or console.error in production code
- [ ] All error handling uses proper ApiError class
- [ ] No hardcoded values or secrets
- [ ] Code follows project conventions

### Testing
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Manual testing completed
- [ ] All validation rules tested
- [ ] Error scenarios tested
- [ ] Edge cases tested

### Security
- [ ] Input validation on all endpoints
- [ ] Authorization checks implemented
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] No sensitive data in logs

### Documentation
- [ ] API documentation complete
- [ ] Integration guide complete
- [ ] Code comments added
- [ ] README updated
- [ ] Team trained

### Database
- [ ] Schema migrations ready
- [ ] Indexes created
- [ ] Backup strategy defined
- [ ] Rollback plan documented

---

## 📦 Deployment Steps

### Step 1: Code Deployment

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run linter
npm run lint

# Run tests
npm test
```

### Step 2: Database Preparation

```bash
# Create MongoDB indexes
db.campaigns.createIndex({ user_id: 1, status: 1 })
db.campaigns.createIndex({ 'schedule.scheduledDate': 1 }, { sparse: true })
db.campaigns.createIndex({ 'analytics.lastUpdated': 1 })

# Create batch jobs collection if needed
db.createCollection('batchJobs')
db.batchJobs.createIndex({ campaignId: 1 })
db.batchJobs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 604800 })  # 7 days TTL
```

### Step 3: Environment Configuration

```bash
# Add to .env file
ADVANCED_SETTINGS_ENABLED=true
BATCH_JOB_RETENTION_DAYS=7
MAX_BATCH_SIZE=5000
DEFAULT_DAILY_LIMIT=5000
```

### Step 4: Staging Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Run smoke tests
npm run test:smoke

# Monitor for 1 hour
```

### Step 5: Production Deployment

```bash
# Deploy to production
npm run deploy:production

# Verify endpoints
curl -X GET http://api.production/api/v1/campaigns/advanced-settings/defaults

# Monitor metrics
```

---

## 🔄 Rollback Procedure

If issues occur:

```bash
# Step 1: Revert code
git revert <commit-hash>
npm run build

# Step 2: Redeploy
npm run deploy:production

# Step 3: Restore data if needed
# Contact DBA team for data restoration

# Step 4: Verify
curl -X GET http://api.production/api/v1/campaigns/
```

---

## 📊 Monitoring & Metrics

### Key Metrics to Monitor

```
API Endpoints:
  - POST /campaigns/:campaignId/advanced-settings - Response time
  - GET /campaigns/:campaignId/advanced-settings - Hit rate
  - POST /campaigns/advanced-settings/validate - Error rate
  - POST /campaigns/:campaignId/validate-batch-sending - Performance
  - GET /campaigns/:campaignId/batch-job/:jobId - Success rate

Database:
  - Query time for campaign.findById()
  - Query time for campaign.updateOne()
  - Batch job collection size
  - Index efficiency

Business Metrics:
  - Campaign creation rate
  - Settings validation success rate
  - Batch sending failures
  - Compliance element injection rate
```

### Monitoring Setup

```typescript
// Add to monitoring system
const metrics = {
  advancedSettings: {
    validationSuccess: Counter('settings_validation_success_total'),
    validationFailure: Counter('settings_validation_failure_total'),
    savingDuration: Histogram('settings_saving_duration_seconds'),
    batchJobCreation: Counter('batch_job_creation_total'),
    batchJobCompletion: Counter('batch_job_completion_total'),
    batchJobFailure: Counter('batch_job_failure_total'),
  }
};
```

### Alerting Rules

```
HIGH_PRIORITY:
  - Validation endpoint error rate > 5%
  - API response time > 2 seconds
  - Database connection failures
  - Batch job failures > 10%

MEDIUM_PRIORITY:
  - Validation success rate < 95%
  - Batch job pending > 1 hour
  - Missing compliance elements

LOW_PRIORITY:
  - Unused presets
  - Settings rarely changed
```

---

## 📈 Performance Tuning

### Database Optimization

```typescript
// Optimize validation checks
// Use in-memory cache for defaults
const defaultsCache = new Map();
defaultsCache.set('defaults', AdvancedSettingsDefaults.getDefaults());

// Batch job collection cleanup
db.batchJobs.deleteMany({ 
  createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
})
```

### API Response Optimization

```typescript
// Use response caching
app.get('/campaigns/advanced-settings/defaults', (req, res) => {
  res.set('Cache-Control', 'public, max-age=86400'); // 1 day
  res.json(defaults);
});

// Gzip compression
app.use(compression());
```

### Batch Processing Optimization

```typescript
// Parallel batch processing
async function sendBatchesInParallel(batches: any[][], concurrency: number = 3) {
  for (let i = 0; i < batches.length; i += concurrency) {
    const batchGroup = batches.slice(i, i + concurrency);
    await Promise.all(batchGroup.map(batch => sendBatch(batch)));
  }
}
```

---

## 🔐 Security Hardening

### Input Validation
```typescript
// Always validate server-side
app.post('/campaigns/advanced-settings/validate', (req, res) => {
  const validation = AdvancedSettingsValidator.validateAdvancedSettings(req.body);
  if (!validation.valid) {
    return res.status(400).json({ errors: validation.errors });
  }
});
```

### Rate Limiting
```typescript
const rateLimit = require('express-rate-limit');

const settingsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.post('/campaigns/advanced-settings/validate', settingsLimiter, handler);
```

### CORS Configuration
```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 📝 Logging & Debugging

### Structured Logging

```typescript
logger.info('Settings saved', {
  campaignId: campaign._id,
  userId: user._id,
  settings: settings,
  timestamp: new Date(),
  ip: req.ip
});

logger.error('Validation failed', {
  errors: validation.errors,
  input: req.body,
  userId: req.user?._id,
  timestamp: new Date()
});
```

### Debug Logs (Development Only)

```typescript
if (process.env.DEBUG_SETTINGS === 'true') {
  console.log('[DEBUG] Preparing recipients for sending');
  console.log('[DEBUG] Original recipients:', recipients.length);
  console.log('[DEBUG] After exclusions:', finalRecipients.length);
}
```

---

## 🚨 Troubleshooting Production Issues

### Issue: High Error Rate on Validation Endpoint

**Symptoms**: Error rate > 5%

**Investigation**:
```bash
# Check logs
tail -f /var/log/kiqi/campaign-settings.log | grep ERROR

# Check metrics
curl http://prometheus:9090/api/v1/query?query=settings_validation_failure_total

# Check recent changes
git log --oneline -10
```

**Solution**:
- Review recent code changes
- Check validation rule updates
- Verify input data format
- Roll back if necessary

### Issue: Slow API Response

**Symptoms**: Response time > 2 seconds

**Investigation**:
```bash
# Check database performance
mongo production-db
db.campaigns.find({_id: ObjectId("...")}).explain("executionStats")

# Check slow queries
mongod --profile=1 --slowms=100

# Check network latency
ping database-server
```

**Solution**:
- Add database indexes
- Optimize query structure
- Enable caching
- Reduce batch sizes

### Issue: Batch Jobs Stuck in Pending

**Symptoms**: Batch jobs not completing

**Investigation**:
```bash
# Check batch job status
db.batchJobs.find({ status: 'pending', createdAt: { $lt: new Date(Date.now() - 3600000) } })

# Check error logs
tail -f logs/batch-jobs.log
```

**Solution**:
- Restart batch processing service
- Increase timeout values
- Check email provider status
- Review compliance issues

---

## 📊 Performance Benchmarks

### Expected Performance

| Metric | Target | Acceptable | Critical |
|--------|--------|-----------|----------|
| Validation API | <100ms | <500ms | >1s |
| Get Settings API | <50ms | <200ms | >500ms |
| Save Settings API | <100ms | <300ms | >1s |
| Batch Job Query | <50ms | <200ms | >500ms |
| Error Rate | <1% | <5% | >10% |

### Load Testing

```bash
# Load test validation endpoint
ab -n 10000 -c 100 -p settings.json http://localhost:8000/api/v1/campaigns/advanced-settings/validate

# Load test get settings
ab -n 10000 -c 100 http://localhost:8000/api/v1/campaigns/camp-123/advanced-settings

# Monitor system resources
top
iostat
netstat
```

---

## 🔄 Maintenance Schedule

### Daily
- Monitor error rates
- Check batch job completion
- Review validation logs

### Weekly
- Performance analysis
- Database optimization
- Backup verification

### Monthly
- Security audit
- Compliance review
- Feature usage analysis

### Quarterly
- Load testing
- Capacity planning
- Security updates

---

## 📋 Post-Deployment Verification

### Verify API Endpoints

```bash
# Test all 6 endpoints
curl -X GET http://localhost:8000/api/v1/campaigns/advanced-settings/defaults
curl -X POST http://localhost:8000/api/v1/campaigns/advanced-settings/validate \
  -d @test-settings.json
curl -X POST http://localhost:8000/api/v1/campaigns/camp-123/advanced-settings \
  -d @test-settings.json
curl -X GET http://localhost:8000/api/v1/campaigns/camp-123/advanced-settings
curl -X POST http://localhost:8000/api/v1/campaigns/camp-123/validate-batch-sending \
  -d '{"totalRecipients": 1000}'
curl -X GET http://localhost:8000/api/v1/campaigns/camp-123/batch-job/batch-123
```

### Verify Database

```bash
# Check collection
db.campaigns.find().limit(1)

# Check indexes
db.campaigns.getIndexes()

# Check data integrity
db.campaigns.count()
```

### Verify Business Logic

```bash
# Test validation
POST /campaigns/advanced-settings/validate
Body: { invalid: "data" }
Expected: 400 with errors

# Test save
POST /campaigns/camp-123/advanced-settings
Body: { valid settings }
Expected: 200 with saved settings

# Test batch feasibility
POST /campaigns/camp-123/validate-batch-sending
Body: { totalRecipients: 100000 }
Expected: 200 with feasibility report
```

---

## 🔐 Security Verification

```bash
# Test authorization
curl -X GET http://localhost:8000/api/v1/campaigns/camp-123/advanced-settings
# Expected: 401 Unauthorized

# Test with valid token
curl -X GET http://localhost:8000/api/v1/campaigns/camp-123/advanced-settings \
  -H "Authorization: Bearer VALID_TOKEN"
# Expected: 200 OK

# Test SQL injection prevention
curl -X POST http://localhost:8000/api/v1/campaigns/advanced-settings/validate \
  -d '{"dailySendLimit": "1000; DROP TABLE campaigns;--"}'
# Expected: 400 Bad Request with type error
```

---

## 📞 On-Call Runbook

### If Service is Down

1. Check status: `systemctl status kiqi-api`
2. Check logs: `journalctl -u kiqi-api -n 100`
3. Restart service: `systemctl restart kiqi-api`
4. Verify endpoints are responding
5. Check metrics dashboard
6. If still down, trigger rollback

### If Error Rate is High

1. Check logs for common errors
2. Review recent deployments
3. Check database connectivity
4. Check email provider status
5. Review rate limits
6. If persists > 10 min, rollback

### If Performance is Degraded

1. Check database slow query log
2. Review active connections
3. Check batch job queue size
4. Review system resources (CPU, memory, disk)
5. Increase resources if needed

---

## 📚 Runbook Links

- [API Documentation](./docs/ADVANCED_CAMPAIGN_SETTINGS.md)
- [Integration Guide](./docs/ADVANCED_SETTINGS_INTEGRATION_GUIDE.md)
- [Troubleshooting](./docs/ADVANCED_SETTINGS_GUIDE.md#troubleshooting)
- [Quick Start](./docs/QUICKSTART_CHECKLIST.md)

---

## ✅ Deployment Sign-Off

- [ ] Code review approved
- [ ] Tests passing
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] Documentation complete
- [ ] Staging deployment verified
- [ ] Team trained
- [ ] Monitoring configured
- [ ] Rollback plan documented
- [ ] Ready for production

---

**Status**: Ready for Production Deployment ✅  
**Version**: 1.0.0  
**Date**: December 16, 2025

For deployment questions, refer to the runbook or contact DevOps team.
