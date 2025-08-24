# Canairy Security Best Practices

## Overview

This guide covers security best practices for deploying and operating Canairy in production. Security is paramount when dealing with sensitive family preparedness data and real-time threat intelligence.

## Table of Contents

1. [Infrastructure Security](#infrastructure-security)
2. [Application Security](#application-security)
3. [Data Security](#data-security)
4. [API Security](#api-security)
5. [Operational Security](#operational-security)
6. [Incident Response](#incident-response)
7. [Compliance](#compliance)
8. [Security Checklist](#security-checklist)

## Infrastructure Security

### Network Security

#### Firewall Configuration
```bash
# Allow only necessary ports
ufw default deny incoming
ufw default allow outgoing

# Web traffic
ufw allow 80/tcp
ufw allow 443/tcp

# SSH (restrict to specific IPs)
ufw allow from 203.0.113.0/24 to any port 22

# Database (internal only)
ufw allow from 10.0.0.0/8 to any port 5432
```

#### Load Balancer Configuration
```nginx
# SSL/TLS Configuration
server {
    listen 443 ssl http2;
    ssl_certificate /etc/ssl/certs/canairy.crt;
    ssl_certificate_key /etc/ssl/private/canairy.key;
    
    # Strong SSL protocols only
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers on;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
}
```

### Container Security

#### Docker Security
```dockerfile
# Use specific versions, not latest
FROM node:18.19-alpine

# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy only necessary files
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs dist ./dist

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js
```

#### Kubernetes Security
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: canairy-app
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    fsGroup: 1001
  containers:
  - name: app
    image: canairy:1.2.3
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
        - ALL
    resources:
      limits:
        memory: "512Mi"
        cpu: "500m"
```

### Secrets Management

#### Environment Variables
```bash
# Never commit secrets to git
# Use secret management tools

# AWS Secrets Manager
aws secretsmanager create-secret \
  --name canairy/production/api-keys \
  --secret-string file://secrets.json

# Kubernetes Secrets
kubectl create secret generic api-keys \
  --from-literal=news_api_key=${NEWS_API_KEY} \
  --from-literal=alpha_vantage_key=${ALPHA_VANTAGE_KEY}
```

#### Key Rotation
```python
# Automated key rotation script
def rotate_api_keys():
    # Generate new key
    new_key = generate_secure_key()
    
    # Update in secret manager
    update_secret("api_key", new_key)
    
    # Deploy new version
    deploy_with_new_key(new_key)
    
    # Verify deployment
    if verify_deployment():
        # Revoke old key after grace period
        schedule_revocation(old_key, hours=24)
```

## Application Security

### Authentication & Authorization

#### JWT Implementation
```typescript
// Secure JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  algorithm: 'RS256',
  expiresIn: '15m',
  refreshExpiresIn: '7d',
  issuer: 'canairy.app',
  audience: 'canairy-users'
};

// Token generation with claims
function generateToken(user: User): string {
  const claims = {
    sub: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    iat: Date.now(),
    jti: generateTokenId() // Unique token ID for revocation
  };
  
  return jwt.sign(claims, privateKey, jwtConfig);
}

// Token validation middleware
async function validateToken(req: Request, res: Response, next: Next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    // Verify signature and claims
    const decoded = jwt.verify(token, publicKey, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });
    
    // Check if token is revoked
    if (await isTokenRevoked(decoded.jti)) {
      return res.status(401).json({ error: 'Token revoked' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

#### Role-Based Access Control
```typescript
// RBAC implementation
const permissions = {
  'user': ['read:indicators', 'read:news', 'read:alerts'],
  'premium': ['read:indicators', 'read:news', 'read:alerts', 'write:preferences', 'export:data'],
  'admin': ['*']
};

function authorize(requiredPermission: string) {
  return (req: Request, res: Response, next: Next) => {
    const userPermissions = permissions[req.user.role] || [];
    
    if (userPermissions.includes('*') || userPermissions.includes(requiredPermission)) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
}

// Usage
router.get('/api/indicators', 
  validateToken, 
  authorize('read:indicators'), 
  getIndicators
);
```

### Input Validation

#### Request Validation
```typescript
// Using Joi for validation
const indicatorSchema = Joi.object({
  id: Joi.string().alphanum().max(50).required(),
  startDate: Joi.date().iso().max('now').required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  resolution: Joi.string().valid('1h', '1d', '1w', '1m').default('1d')
});

function validateRequest(schema: Joi.Schema) {
  return (req: Request, res: Response, next: Next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }
    
    req.body = value;
    next();
  };
}
```

#### SQL Injection Prevention
```typescript
// Use parameterized queries
async function getIndicatorData(indicatorId: string, startDate: Date) {
  // Good: Parameterized query
  const query = `
    SELECT value, timestamp, status
    FROM indicator_values
    WHERE indicator_id = $1 AND timestamp >= $2
    ORDER BY timestamp DESC
  `;
  
  const result = await db.query(query, [indicatorId, startDate]);
  return result.rows;
}

// Bad: String concatenation (NEVER DO THIS)
// const query = `SELECT * FROM indicators WHERE id = '${indicatorId}'`;
```

### XSS Prevention

#### Content Security Policy
```typescript
// CSP headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' wss://api.canairy.app https://api.canairy.app;"
  );
  next();
});
```

#### Output Encoding
```typescript
// React automatically escapes values
function IndicatorCard({ indicator }) {
  return (
    <div>
      {/* Safe: React escapes this */}
      <h3>{indicator.name}</h3>
      
      {/* Dangerous: Never use dangerouslySetInnerHTML with user content */}
      {/* <div dangerouslySetInnerHTML={{__html: indicator.description}} /> */}
      
      {/* Safe: Use a sanitization library if HTML is needed */}
      <div>{DOMPurify.sanitize(indicator.description)}</div>
    </div>
  );
}
```

## Data Security

### Encryption at Rest

#### Database Encryption
```sql
-- PostgreSQL transparent data encryption
CREATE TABLE sensitive_data (
  id UUID PRIMARY KEY,
  encrypted_data BYTEA
);

-- Encrypt sensitive fields
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO sensitive_data (id, encrypted_data)
VALUES (
  gen_random_uuid(),
  pgp_sym_encrypt('sensitive info', current_setting('app.encryption_key'))
);
```

#### File Storage Encryption
```python
# Encrypt files before storage
from cryptography.fernet import Fernet

def encrypt_file(file_path: str, key: bytes):
    fernet = Fernet(key)
    
    with open(file_path, 'rb') as file:
        file_data = file.read()
    
    encrypted_data = fernet.encrypt(file_data)
    
    with open(f"{file_path}.encrypted", 'wb') as file:
        file.write(encrypted_data)
```

### Encryption in Transit

#### TLS Configuration
```javascript
// Force TLS for all connections
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem'),
  // Reject unauthorized connections
  rejectUnauthorized: true,
  // Use TLS 1.2 minimum
  secureProtocol: 'TLSv1_2_method'
};

https.createServer(options, app).listen(443);
```

### Data Privacy

#### PII Protection
```typescript
// Anonymize user data
function anonymizeUser(user: User): AnonymizedUser {
  return {
    id: hashUserId(user.id),
    region: generalizeLocation(user.location),
    preferences: user.preferences,
    // Never log sensitive data
    // email: user.email, // DON'T DO THIS
    // phone: user.phone, // DON'T DO THIS
  };
}

// Audit logging without PII
function logUserAction(userId: string, action: string) {
  logger.info({
    userId: hashUserId(userId),
    action,
    timestamp: new Date().toISOString(),
    // No PII in logs
  });
}
```

## API Security

### Rate Limiting

```typescript
// Rate limiting configuration
const rateLimit = require('express-rate-limit');

// Different limits for different endpoints
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 requests per window for sensitive ops
  skipSuccessfulRequests: false,
});

// Apply to routes
app.use('/api/', standardLimiter);
app.use('/api/auth/', strictLimiter);
```

### API Key Management

```typescript
// Secure API key validation
async function validateApiKey(req: Request, res: Response, next: Next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Hash the API key before database lookup
  const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
  
  const keyRecord = await db.query(
    'SELECT * FROM api_keys WHERE key_hash = $1 AND expires_at > NOW()',
    [hashedKey]
  );
  
  if (keyRecord.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  // Track usage
  await db.query(
    'UPDATE api_keys SET last_used = NOW(), usage_count = usage_count + 1 WHERE key_hash = $1',
    [hashedKey]
  );
  
  req.apiKey = keyRecord.rows[0];
  next();
}
```

### CORS Configuration

```typescript
// Strict CORS policy
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://canairy.app',
      'https://app.canairy.app',
      process.env.NODE_ENV === 'development' ? 'http://localhost:3005' : null
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

## Operational Security

### Logging & Monitoring

#### Security Logging
```typescript
// Structured security logging
const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'canairy-security' },
  transports: [
    new winston.transports.File({ filename: 'security.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Log security events
function logSecurityEvent(event: SecurityEvent) {
  securityLogger.info({
    event_type: event.type,
    user_id: event.userId ? hashUserId(event.userId) : null,
    ip_address: hashIpAddress(event.ipAddress),
    user_agent: event.userAgent,
    timestamp: new Date().toISOString(),
    details: event.details
  });
}

// Security event examples
logSecurityEvent({
  type: 'failed_login',
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  details: { attempts: 3 }
});
```

#### Intrusion Detection

```python
# Anomaly detection for security events
def detect_anomalies():
    # Check for suspicious patterns
    suspicious_patterns = [
        # Multiple failed logins from same IP
        """
        SELECT ip_address, COUNT(*) as attempts
        FROM security_logs
        WHERE event_type = 'failed_login' 
        AND timestamp > NOW() - INTERVAL '1 hour'
        GROUP BY ip_address
        HAVING COUNT(*) > 5
        """,
        
        # Unusual API usage patterns
        """
        SELECT api_key_id, COUNT(DISTINCT endpoint) as endpoints
        FROM api_logs
        WHERE timestamp > NOW() - INTERVAL '1 hour'
        GROUP BY api_key_id
        HAVING COUNT(DISTINCT endpoint) > 50
        """
    ]
    
    for pattern in suspicious_patterns:
        results = db.execute(pattern)
        if results:
            alert_security_team(pattern, results)
```

### Backup Security

```bash
#!/bin/bash
# Secure backup script

# Encrypt backups
backup_database() {
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Dump database
    pg_dump $DATABASE_URL > $backup_file
    
    # Encrypt with GPG
    gpg --encrypt --recipient backup@canairy.app $backup_file
    
    # Upload to secure storage
    aws s3 cp $backup_file.gpg s3://canairy-backups/ \
        --server-side-encryption aws:kms \
        --storage-class GLACIER
    
    # Clean up
    shred -vfz $backup_file
    rm $backup_file.gpg
}

# Verify backup integrity
verify_backup() {
    local backup_file=$1
    
    # Download and decrypt
    aws s3 cp s3://canairy-backups/$backup_file .
    gpg --decrypt $backup_file > decrypted.sql
    
    # Verify integrity
    if pg_restore --list decrypted.sql > /dev/null 2>&1; then
        echo "Backup verified successfully"
    else
        alert_team "Backup verification failed: $backup_file"
    fi
    
    # Clean up
    shred -vfz decrypted.sql
}
```

## Incident Response

### Incident Response Plan

```markdown
# Security Incident Response Plan

## 1. Detection & Analysis
- Monitor security alerts
- Validate incident severity
- Document initial findings

## 2. Containment
- Isolate affected systems
- Preserve evidence
- Prevent spread

## 3. Eradication
- Remove threat
- Patch vulnerabilities
- Update security controls

## 4. Recovery
- Restore from clean backups
- Monitor for reinfection
- Verify system integrity

## 5. Post-Incident
- Document lessons learned
- Update security procedures
- Notify stakeholders if required
```

### Automated Response

```typescript
// Automated security response
async function respondToThreat(threat: SecurityThreat) {
  switch (threat.type) {
    case 'brute_force':
      // Block IP address
      await blockIpAddress(threat.sourceIp);
      // Notify user
      await notifyUser(threat.targetUser, 'Suspicious login attempts detected');
      break;
      
    case 'api_abuse':
      // Revoke API key
      await revokeApiKey(threat.apiKey);
      // Rate limit the IP
      await applyStrictRateLimit(threat.sourceIp);
      break;
      
    case 'data_exfiltration':
      // Lock user account
      await lockUserAccount(threat.userId);
      // Alert security team
      await alertSecurityTeam('CRITICAL: Possible data exfiltration', threat);
      break;
  }
  
  // Log all responses
  await logSecurityResponse(threat, response);
}
```

## Compliance

### GDPR Compliance

```typescript
// GDPR data handling
class GDPRCompliance {
  // Right to access
  async exportUserData(userId: string): Promise<UserDataExport> {
    const data = await collectAllUserData(userId);
    return {
      profile: data.profile,
      preferences: data.preferences,
      activityLog: data.activities,
      exportDate: new Date().toISOString()
    };
  }
  
  // Right to deletion
  async deleteUserData(userId: string): Promise<void> {
    // Soft delete with retention period
    await db.query(
      'UPDATE users SET deleted_at = NOW(), data_retention_until = NOW() + INTERVAL \'30 days\' WHERE id = $1',
      [userId]
    );
    
    // Schedule hard delete
    await scheduleDataDeletion(userId, 30);
  }
  
  // Consent management
  async updateConsent(userId: string, consents: ConsentUpdate): Promise<void> {
    await db.query(
      'INSERT INTO user_consents (user_id, consent_type, granted, timestamp) VALUES ($1, $2, $3, NOW())',
      [userId, consents.type, consents.granted]
    );
  }
}
```

### Security Headers

```javascript
// Comprehensive security headers
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Feature policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
});
```

## Security Checklist

### Pre-Deployment

- [ ] All dependencies updated and vulnerability-free
- [ ] Secrets removed from code and configs
- [ ] SSL/TLS certificates valid and strong
- [ ] Security headers configured
- [ ] Input validation on all endpoints
- [ ] Authentication and authorization tested
- [ ] Rate limiting configured
- [ ] Logging and monitoring active

### Post-Deployment

- [ ] Security scan completed (OWASP ZAP, etc.)
- [ ] Penetration testing performed
- [ ] Backup and recovery tested
- [ ] Incident response plan reviewed
- [ ] Team trained on security procedures
- [ ] Security metrics dashboard active
- [ ] Compliance requirements verified
- [ ] Third-party security audit scheduled

### Ongoing

- [ ] Weekly vulnerability scans
- [ ] Monthly security reviews
- [ ] Quarterly penetration tests
- [ ] Annual security training
- [ ] Continuous dependency updates
- [ ] Regular key rotation
- [ ] Backup verification
- [ ] Incident response drills

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Security Controls](https://www.cisecurity.org/controls)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Security Tools](https://github.com/canairy/security-tools)

---

*Security is everyone's responsibility. Report concerns to security@canairy.app*