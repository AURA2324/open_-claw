# Internal Order System Integration Guide

## Overview

Open Claw is designed to be flexible and work with various internal order systems. This guide explains how to integrate with your specific system.

## Integration Points

The order system integration happens in three main files:

1. **`src/services/orderSystem.js`** - Main integration service
2. **`src/services/matcher.js`** - Matching logic
3. **`.env` configuration** - Connection details

## Two Integration Approaches

### Approach 1: REST API Integration (Recommended)

If your order system has REST API endpoints:

#### Configuration

```env
ORDER_SYSTEM_API_URL=https://api.yoursystem.com
ORDER_SYSTEM_API_KEY=your_secret_api_key
```

#### Implementation

The default implementation in `orderSystem.js` already supports REST API:

```javascript
async _callOrderSystemAPI(endpoint, params) {
  const url = `${this.apiUrl}${endpoint}`;
  const response = await axios.get(url, {
    params,
    headers: {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });
  return { success: true, data: response.data };
}
```

#### Required API Endpoints

Your system must provide:

**1. Get Order by Phone Number**
```
GET /orders/by-phone?phoneNumber=%2B255700000000
Response: {
  "id": "ORD-001",
  "customerName": "John Doe",
  "imei": "123456789012345",
  "phoneNumber": "+255700000000"
}
```

**2. Get Orders by Customer Name**
```
GET /orders/by-name?customerName=John
Response: [
  {
    "id": "ORD-001",
    "customerName": "John Doe",
    "imei": "123456789012345"
  },
  {
    "id": "ORD-002",
    "customerName": "John Smith",
    "imei": "987654321098765"
  }
]
```

**3. Get Order by ID**
```
GET /orders/ORD-001
Response: {
  "id": "ORD-001",
  "customerName": "John Doe",
  "imei": "123456789012345",
  "phoneNumber": "+255700000000",
  "orderDate": "2024-01-15",
  "status": "completed"
}
```

### Approach 2: Direct Database Connection

If your system doesn't have APIs, connect directly to the database:

#### Configuration

```env
ORDER_SYSTEM_DB_HOST=localhost
ORDER_SYSTEM_DB_USER=dbuser
ORDER_SYSTEM_DB_PASSWORD=password
ORDER_SYSTEM_DB_NAME=orders_db
```

#### Implementation

Modify `src/services/orderSystem.js`:

```javascript
import mysql from 'mysql2/promise';

class OrderSystemService {
  constructor() {
    this.pool = mysql.createPool({
      host: config.orderSystemDbHost,
      user: config.orderSystemDbUser,
      password: config.orderSystemDbPassword,
      database: config.orderSystemDbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  async getOrderByPhoneNumber(phoneNumber) {
    const normalized = validators.normalizePhoneNumber(phoneNumber);
    
    try {
      const connection = await this.pool.getConnection();
      const [rows] = await connection.query(
        'SELECT * FROM orders WHERE phone_number = ? LIMIT 1',
        [normalized]
      );
      connection.release();

      if (rows.length > 0) {
        return {
          id: rows[0].id,
          customerName: rows[0].customer_name,
          imei: rows[0].imei,
          phoneNumber: rows[0].phone_number,
        };
      }
      return null;
    } catch (error) {
      logger.error('Database query failed', { error: error.message });
      return null;
    }
  }
}
```

## Data Format Specifications

### Phone Number Format

All phone numbers must include country code:
- ✅ Correct: `+255700000000`
- ❌ Incorrect: `0700000000`
- ❌ Incorrect: `700000000`

### IMEI Format

IMEI must be exactly 15 digits:
- ✅ Correct: `123456789012345`
- ❌ Incorrect: `12345678901234` (14 digits)
- ❌ Incorrect: `1234567890123456` (16 digits)

### Customer Name Format

Customer names should be clean strings:
- ✅ Correct: `John Doe`
- ✅ Correct: `محمد علي` (Unicode supported)
- Store original registered name for matching accuracy

## Testing Your Integration

### Step 1: Verify API Connectivity

```bash
curl -H "X-API-Key: YOUR_KEY" \
  "https://api.yoursystem.com/orders/by-phone?phoneNumber=%2B255700000000"
```

### Step 2: Test Order Matching

```bash
curl -X POST http://localhost:3000/api/orders/match-by-phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+255700000000"}'
```

### Step 3: Monitor Logs

Check for any errors in the application logs:
```
tail -f logs/error.log
```

## Optimization Tips

### 1. Add Database Indexes

For best performance, create indexes on your order table:

```sql
-- Phone number index (Primary search)
CREATE INDEX idx_phone ON orders(phone_number);

-- Customer name index (Fuzzy search)
CREATE INDEX idx_customer_name ON orders(customer_name);

-- IMEI index (Verification)
CREATE INDEX idx_imei ON orders(imei);
```

### 2. Use Caching Strategically

Open Claw caches results automatically. For 1000 customers:
- 60% hit rate on phone queries saves ~600 API calls/hour
- Cache TTL: 3600 seconds (1 hour)
- Adjust via `CACHE_TTL` environment variable

### 3. Batch API Calls

If querying many orders, modify the API to support batch queries:

```javascript
async getOrdersByIds(orderIds) {
  const response = await axios.get(
    `${this.apiUrl}/orders/batch`,
    {
      params: { ids: orderIds.join(',') },
      headers: { 'X-API-Key': this.apiKey },
    }
  );
  return response.data;
}
```

### 4. Handle Rate Limiting

Add backoff logic:

```javascript
async _callWithRetry(url, params, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.get(url, { params, timeout: 10000 });
      return { success: true, data: response.data };
    } catch (error) {
      if (error.response?.status === 429) {
        // Rate limited, wait exponentially
        const wait = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, wait));
      } else {
        throw error;
      }
    }
  }
}
```

## Troubleshooting

### Problem: "No order found for phone number"

**Cause**: Phone number format mismatch

**Solution**:
1. Check phone numbers are stored with +255 prefix
2. Verify no leading zeros in database
3. Test with: `curl "http://localhost:3000/api/orders/match-by-phone" -d '{"phoneNumber": "+255700000000"}'`

### Problem: "Slow order queries"

**Cause**: Missing database indexes

**Solution**:
1. Create indexes on phone, name, IMEI fields
2. Monitor query performance: `EXPLAIN SELECT...`
3. Check cache hit rate: `GET /api/stats`

### Problem: "API authentication failed"

**Cause**: Invalid API key or header

**Solution**:
1. Verify API key in `.env`
2. Check header format: `X-API-Key: your_key`
3. Test directly: `curl -H "X-API-Key: test" https://api.yoursystem.com/health`

## Support

For integration assistance:
1. Document your API endpoints
2. Share sample response formats
3. Verify test credentials work
4. Monitor logs during integration testing
