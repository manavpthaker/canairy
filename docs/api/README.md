# Canairy API Reference

## Overview

The Canairy API provides programmatic access to indicator data, alerts, and system status. This RESTful API supports JSON requests and responses.

## Base URL

```
Production: https://api.canairy.app/v1
Development: http://localhost:8000/api/v1
```

## Authentication

All API requests require authentication using Bearer tokens:

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
  https://api.canairy.app/v1/indicators
```

### Obtaining API Tokens

```http
POST /auth/token
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

## Core Endpoints

### System Status

#### Get System Status
```http
GET /status
```

Response:
```json
{
  "status": "operational",
  "phase": {
    "number": 0,
    "name": "Normal Operations",
    "description": "All systems functioning normally"
  },
  "hopi_score": {
    "value": 23.5,
    "trend": "down",
    "last_updated": "2024-01-20T15:30:00Z"
  },
  "threat_level": "normal",
  "indicators_summary": {
    "total": 22,
    "red": 0,
    "amber": 2,
    "green": 20
  },
  "last_update": "2024-01-20T15:30:00Z"
}
```

### Indicators

#### List All Indicators
```http
GET /indicators
```

Query Parameters:
- `status` (optional): Filter by status (red, amber, green)
- `category` (optional): Filter by category (financial, supply_chain, energy, social)
- `critical` (optional): Filter critical indicators only (true/false)

Response:
```json
{
  "indicators": [
    {
      "id": "treasury_tail",
      "name": "Treasury Tail Risk",
      "category": "financial",
      "status": {
        "level": "green",
        "value": 1.2,
        "trend": "stable",
        "last_update": "2024-01-20T15:00:00Z"
      },
      "unit": "ratio",
      "critical": true,
      "thresholds": {
        "green": {"min": 0, "max": 1.5},
        "amber": {"min": 1.5, "max": 2.5},
        "red": {"min": 2.5, "max": null}
      }
    }
    // ... more indicators
  ],
  "count": 22
}
```

#### Get Specific Indicator
```http
GET /indicators/{indicator_id}
```

Response includes full indicator details plus:
```json
{
  // ... basic indicator data ...
  "description": {
    "what": "Measures stress in US Treasury markets",
    "why_it_matters": "Predicts banking system instability",
    "thresholds": {
      "green": "Normal market functioning",
      "amber": "Stress building, monitor closely",
      "red": "Banking crisis risk elevated"
    }
  },
  "metadata": {
    "data_source": "US Treasury Direct",
    "update_frequency": "daily",
    "last_breach": "2023-03-10T00:00:00Z",
    "average_value": 1.8
  }
}
```

#### Get Indicator History
```http
GET /indicators/{indicator_id}/history
```

Query Parameters:
- `start_date` (required): ISO 8601 date
- `end_date` (optional): ISO 8601 date (default: now)
- `resolution` (optional): 1h, 1d, 1w, 1m (default: 1d)

Response:
```json
{
  "indicator_id": "treasury_tail",
  "data_points": [
    {
      "timestamp": "2024-01-20T00:00:00Z",
      "value": 1.2,
      "status": "green"
    },
    {
      "timestamp": "2024-01-19T00:00:00Z",
      "value": 1.3,
      "status": "green"
    }
    // ... more data points
  ],
  "count": 30
}
```

### Alerts

#### Get Active Alerts
```http
GET /alerts
```

Query Parameters:
- `acknowledged` (optional): Include acknowledged alerts (true/false)
- `severity` (optional): Filter by severity (critical, high, medium, low)
- `indicator_id` (optional): Filter by indicator

Response:
```json
{
  "alerts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "indicator_id": "taiwan_zone",
      "severity": "high",
      "title": "Taiwan Exclusion Zone Activated",
      "message": "Military exercises announced in Taiwan Strait",
      "created_at": "2024-01-20T14:00:00Z",
      "acknowledged": false,
      "actions": [
        "Monitor semiconductor supply chains",
        "Consider increasing inventory of critical components"
      ]
    }
  ],
  "count": 1
}
```

#### Acknowledge Alert
```http
POST /alerts/{alert_id}/acknowledge
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "acknowledged": true,
  "acknowledged_at": "2024-01-20T15:45:00Z",
  "acknowledged_by": "user_123"
}
```

### News Intelligence

#### Get Related News
```http
GET /news
```

Query Parameters:
- `indicator_id` (optional): Filter by indicator
- `limit` (optional): Number of articles (default: 20)
- `min_credibility` (optional): Minimum credibility score 0-100

Response:
```json
{
  "articles": [
    {
      "id": "news_123",
      "title": "Federal Reserve Signals Concern Over Treasury Market",
      "source": {
        "name": "Reuters",
        "credibility_score": 95
      },
      "published_at": "2024-01-20T12:00:00Z",
      "url": "https://reuters.com/...",
      "summary": "Fed officials express worry about...",
      "related_indicators": ["treasury_tail", "vix_volatility"],
      "sentiment": "negative",
      "relevance_score": 0.89
    }
  ],
  "count": 20
}
```

### Actions

#### Get Priority Actions
```http
GET /actions
```

Query Parameters:
- `urgency` (optional): immediate, today, this_week
- `category` (optional): financial, supply, energy, family
- `completed` (optional): Include completed actions

Response:
```json
{
  "actions": [
    {
      "id": "action_001",
      "category": "financial",
      "urgency": "today",
      "title": "Secure Bank Deposits",
      "why": "Treasury markets showing stress",
      "steps": [
        "Check all bank balances",
        "Move amounts over $250k to different banks",
        "Withdraw 2 weeks cash"
      ],
      "resources": [
        {
          "type": "phone",
          "label": "FDIC Hotline",
          "value": "1-877-275-3342"
        }
      ],
      "estimated_time": "2-3 hours",
      "impact": "Protects savings from bank failures"
    }
  ],
  "count": 5
}
```

#### Mark Action Complete
```http
POST /actions/{action_id}/complete
```

Response:
```json
{
  "id": "action_001",
  "completed": true,
  "completed_at": "2024-01-20T16:00:00Z"
}
```

### Historical Analysis

#### Get Pattern Matches
```http
GET /analysis/patterns
```

Query Parameters:
- `current_state` (optional): Include current state analysis

Response:
```json
{
  "patterns": [
    {
      "pattern_id": "banking_stress_2023",
      "name": "March 2023 Banking Crisis",
      "similarity_score": 0.78,
      "matching_indicators": [
        "treasury_tail",
        "vix_volatility"
      ],
      "historical_outcome": "Regional bank failures, Fed intervention",
      "duration_days": 14,
      "peak_impact": "2023-03-13"
    }
  ]
}
```

### WebSocket API

#### Real-time Updates
```javascript
const ws = new WebSocket('wss://api.canairy.app/v1/ws');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'YOUR_API_TOKEN'
  }));
  
  // Subscribe to updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['indicators', 'alerts']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'indicator_update':
      console.log('Indicator updated:', data.payload);
      break;
    case 'new_alert':
      console.log('New alert:', data.payload);
      break;
  }
};
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Indicator not found",
    "details": {
      "indicator_id": "invalid_id"
    }
  },
  "request_id": "req_123456"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | 404 | Resource doesn't exist |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limiting

Default limits:
- **Free tier**: 100 requests/hour
- **Premium**: 1000 requests/hour
- **Enterprise**: Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @canairy/sdk
```

```javascript
import { CanairyClient } from '@canairy/sdk';

const client = new CanairyClient({
  apiKey: 'YOUR_API_KEY'
});

const indicators = await client.indicators.list({
  status: 'red'
});
```

### Python
```bash
pip install canairy-sdk
```

```python
from canairy import Client

client = Client(api_key='YOUR_API_KEY')

indicators = client.indicators.list(status='red')
for indicator in indicators:
    print(f"{indicator.name}: {indicator.status.value}")
```

## Webhooks

### Configure Webhook
```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["indicator.red", "alert.new"],
  "secret": "your_webhook_secret"
}
```

### Webhook Payload
```json
{
  "event": "indicator.red",
  "timestamp": "2024-01-20T15:00:00Z",
  "data": {
    "indicator_id": "treasury_tail",
    "old_status": "amber",
    "new_status": "red",
    "value": 2.8
  }
}
```

### Verify Webhook Signature
```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected, signature)
```

## Testing

### Test Environment
```
Base URL: https://api-test.canairy.app/v1
Test API Key: test_key_123456
```

### Postman Collection
Download our [Postman Collection](https://api.canairy.app/postman-collection.json) for easy testing.

## Changelog

### v1.2.0 (2024-01-15)
- Added pattern matching endpoint
- Improved WebSocket reliability
- Added indicator metadata

### v1.1.0 (2023-12-01)
- Added webhook support
- Enhanced news intelligence
- Performance improvements

### v1.0.0 (2023-10-01)
- Initial public release

## Support

- **Documentation**: https://docs.canairy.app
- **Status Page**: https://status.canairy.app
- **Support Email**: api-support@canairy.app
- **Discord**: https://discord.gg/canairy

---

*API documentation is auto-generated from OpenAPI specification. For the latest version, visit `/docs` on any API endpoint.*