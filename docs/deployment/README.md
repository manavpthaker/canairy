# Canairy Deployment Guide

## Overview

This guide covers deploying Canairy to production environments. We support multiple deployment options to meet different scale and security requirements.

## Deployment Options

### 1. Single Server (Small Scale)
- **Best for**: Personal/family use, < 100 users
- **Requirements**: 2 CPU, 4GB RAM, 50GB storage
- **Cost**: ~$20-40/month

### 2. Kubernetes Cluster (Medium Scale)
- **Best for**: Community deployment, 100-10,000 users
- **Requirements**: 3+ nodes, load balancer, persistent storage
- **Cost**: ~$200-500/month

### 3. Multi-Region (Large Scale)
- **Best for**: Enterprise/SaaS, 10,000+ users
- **Requirements**: Multiple regions, CDN, managed services
- **Cost**: ~$1000+/month

## Quick Start Deployment

### Using Docker Compose

1. **Clone repository**
   ```bash
   git clone https://github.com/manavpthaker/canairy.git
   cd canairy
   ```

2. **Configure environment**
   ```bash
   cp .env.production.example .env
   # Edit .env with your configuration
   ```

3. **Build and deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Initialize database**
   ```bash
   docker-compose exec backend python manage.py migrate
   docker-compose exec backend python manage.py createsuperuser
   ```

5. **Access application**
   - Frontend: https://your-domain.com
   - API: https://your-domain.com/api
   - Admin: https://your-domain.com/admin

## Production Configuration

### Environment Variables

```bash
# Application
NODE_ENV=production
APP_URL=https://canairy.app
API_URL=https://api.canairy.app

# Database
DATABASE_URL=postgresql://user:pass@host:5432/canairy
REDIS_URL=redis://host:6379

# Security
JWT_SECRET=<generate-strong-secret>
ENCRYPTION_KEY=<generate-strong-key>
ADMIN_EMAIL=admin@canairy.app

# External APIs (obtain from providers)
NEWS_API_KEY=<your-key>
ALPHA_VANTAGE_API_KEY=<your-key>
OPENAI_API_KEY=<your-key>

# Monitoring
SENTRY_DSN=<your-sentry-dsn>
DATADOG_API_KEY=<your-datadog-key>

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<your-sendgrid-key>
```

### SSL/TLS Setup

#### Using Let's Encrypt with Certbot
```bash
# Install certbot
apt-get update
apt-get install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d canairy.app -d www.canairy.app -d api.canairy.app

# Auto-renewal
echo "0 0,12 * * * root python -c 'import random; import time; time.sleep(random.randint(0,3600))' && certbot renew" >> /etc/crontab
```

#### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name canairy.app;

    ssl_certificate /etc/letsencrypt/live/canairy.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/canairy.app/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Database Setup

### PostgreSQL Configuration

```sql
-- Create database and user
CREATE DATABASE canairy;
CREATE USER canairy_user WITH ENCRYPTED PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE canairy TO canairy_user;

-- Enable required extensions
\c canairy
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- Optimize for time-series data
SELECT create_hypertable('indicator_values', 'timestamp');
```

### Redis Configuration

```conf
# /etc/redis/redis.conf
bind 127.0.0.1
port 6379
requirepass your_redis_password
maxmemory 1gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## Kubernetes Deployment

### Helm Chart Installation

```bash
# Add Canairy Helm repository
helm repo add canairy https://charts.canairy.app
helm repo update

# Install with custom values
helm install canairy canairy/canairy \
  --namespace canairy \
  --create-namespace \
  --values values.yaml
```

### Sample values.yaml

```yaml
global:
  domain: canairy.app
  
frontend:
  replicas: 3
  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"
    limits:
      memory: "512Mi"
      cpu: "500m"

backend:
  replicas: 3
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70

postgresql:
  enabled: true
  postgresqlPassword: changeme
  persistence:
    size: 100Gi
    
redis:
  enabled: true
  auth:
    password: changeme
    
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  tls:
    - secretName: canairy-tls
      hosts:
        - canairy.app
        - api.canairy.app
```

## Monitoring Setup

### Prometheus Metrics

```yaml
# prometheus-config.yaml
scrape_configs:
  - job_name: 'canairy-api'
    static_configs:
      - targets: ['api.canairy.app:9090']
    metrics_path: '/metrics'
    
  - job_name: 'canairy-collectors'
    static_configs:
      - targets: ['collector-1:9090', 'collector-2:9090']
```

### Grafana Dashboards

Import our pre-built dashboards:
1. System Overview: `grafana-dashboard-system.json`
2. API Performance: `grafana-dashboard-api.json`
3. Indicator Status: `grafana-dashboard-indicators.json`

### Health Checks

```yaml
# kubernetes health checks
livenessProbe:
  httpGet:
    path: /health/live
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10
  
readinessProbe:
  httpGet:
    path: /health/ready
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Backup Strategy

### Automated Backups

```bash
#!/bin/bash
# backup.sh - Run via cron

# Database backup
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d-%H%M%S).sql.gz

# Upload to S3
aws s3 cp backup-*.sql.gz s3://canairy-backups/db/ --storage-class GLACIER

# Keep last 30 days locally
find . -name "backup-*.sql.gz" -mtime +30 -delete

# Backup configuration
tar -czf config-backup-$(date +%Y%m%d).tar.gz /etc/canairy

# Verify backup
if [ $? -eq 0 ]; then
    echo "Backup successful"
else
    echo "Backup failed" | mail -s "Canairy Backup Failed" ops@canairy.app
fi
```

### Restore Procedure

```bash
# Restore database
gunzip < backup-20240120-120000.sql.gz | psql $DATABASE_URL

# Restore configuration
tar -xzf config-backup-20240120.tar.gz -C /
```

## Performance Optimization

### Caching Configuration

```javascript
// Redis caching strategy
const cacheConfig = {
  indicators: {
    ttl: 60, // 1 minute for live data
    prefix: 'ind:'
  },
  news: {
    ttl: 300, // 5 minutes for news
    prefix: 'news:'
  },
  historical: {
    ttl: 3600, // 1 hour for historical
    prefix: 'hist:'
  }
};
```

### CDN Setup

```nginx
# CloudFlare configuration
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Security Hardening

See [Security Best Practices](security.md) for detailed security configuration.

### Quick Security Checklist

- [ ] Firewall configured
- [ ] SSL/TLS enabled
- [ ] Security headers set
- [ ] Database encrypted
- [ ] Backups encrypted
- [ ] Monitoring enabled
- [ ] Intrusion detection active
- [ ] Regular updates scheduled

## Troubleshooting

### Common Issues

#### High Memory Usage
```bash
# Check memory usage
docker stats

# Restart specific service
docker-compose restart backend

# Clear Redis cache
redis-cli FLUSHDB
```

#### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool
SELECT count(*) FROM pg_stat_activity;

# Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' AND state_change < now() - interval '5 minutes';
```

#### API Performance Issues
```bash
# Check slow queries
SELECT query, calls, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

# Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s
```

## Maintenance

### Update Procedure

```bash
# 1. Backup everything
./scripts/backup.sh

# 2. Pull latest changes
git pull origin main

# 3. Build new images
docker-compose build

# 4. Deploy with zero downtime
docker-compose up -d --no-deps --scale backend=2 backend
docker-compose up -d --no-deps frontend

# 5. Run migrations
docker-compose exec backend python manage.py migrate

# 6. Verify deployment
curl https://api.canairy.app/health
```

### Scheduled Maintenance

```cron
# Crontab entries
0 2 * * * /opt/canairy/scripts/backup.sh
0 3 * * 0 /opt/canairy/scripts/cleanup-logs.sh
0 4 * * * /opt/canairy/scripts/update-geoip.sh
```

## Support

### Getting Help

- **Documentation**: https://docs.canairy.app
- **Status Page**: https://status.canairy.app
- **Emergency**: ops@canairy.app / +1-555-0123

### Monitoring Alerts

Configure alerts for:
- API response time > 1s
- Error rate > 1%
- Database connection pool > 80%
- Disk usage > 80%
- Certificate expiry < 30 days

---

*For enterprise deployment support, contact enterprise@canairy.app*