# API Testing Guide

## Authentication

The Open Claw API uses a webhook-based model for WhatsApp integration. No authentication required for testing endpoints.

## Testing Order Matching

### Test 1: Match Order by Phone Number (Priority 1)

```bash
curl -X POST http://localhost:3000/api/orders/match-by-phone \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+255700000000"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "matchType": "EXACT_PHONE",
  "order": {
    "id": "ORD-001",
    "customerName": "John Doe",
    "imei": "123456789012345",
    "phoneNumber": "+255700000000"
  },
  "confidence": 100
}
```

### Test 2: Match Orders by Customer Name (Priority 2)

```bash
curl -X POST http://localhost:3000/api/orders/match-by-name \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "matchType": "FUZZY_NAME",
  "orders": [
    {
      "id": "ORD-001",
      "customerName": "John Doe",
      "imei": "123456789012345",
      "similarity": 95.5
    },
    {
      "id": "ORD-002",
      "customerName": "John Smith",
      "imei": "987654321098765",
      "similarity": 85.3
    }
  ],
  "message": "Similar orders found. Please verify the correct one."
}
```

### Test 3: Full Order Matching

```bash
curl -X POST http://localhost:3000/api/orders/match-full \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+255700000000",
    "customerName": "John Doe"
  }'
```

## Testing Messages

### Send Manual Message

```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+255700000000",
    "message": "Hello, this is a test message from Open Claw!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "messageId": "wamid.HBEUGQiQFJQAQA...",
  "message": "Message sent successfully"
}
```

### Get Message History

```bash
curl http://localhost:3000/api/messages?limit=20&offset=0
```

**Expected Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "wamid.xxx",
      "from": "+255700000000",
      "text": "Hello Open Claw",
      "type": "text",
      "timestamp": 1234567890,
      "processed": true,
      "matchType": "EXACT_PHONE"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

## Testing System Health

### Health Check

```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-05-08T12:34:56.789Z",
  "uptime": 3600000
}
```

### System Statistics

```bash
curl http://localhost:3000/api/stats
```

**Expected Response:**
```json
{
  "success": true,
  "system": {
    "uptime": "1.50 hours",
    "messagesProcessed": 42,
    "ordersMatched": 35,
    "errors": 0
  },
  "cache": {
    "hits": 25,
    "misses": 10,
    "sets": 35,
    "deletes": 0,
    "hitRate": "71.43%",
    "size": 5,
    "keys": ["order_phone_+255700000000", ...]
  },
  "timestamp": "2024-05-08T12:34:56.789Z"
}
```

## Testing WhatsApp Webhook

### Webhook Verification (GET)

Render will send this automatically. For testing:

```bash
curl "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=test_challenge"
```

Expected response: Returns the challenge value

### Simulate Incoming Message (POST)

```bash
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [
      {
        "id": "123456",
        "changes": [
          {
            "field": "messages",
            "value": {
              "messaging_product": "whatsapp",
              "metadata": {
                "display_phone_number": "255700000000",
                "phone_number_id": "123456789"
              },
              "contacts": [
                {
                  "profile": {
                    "name": "John Doe"
                  },
                  "wa_id": "255700000000"
                }
              ],
              "messages": [
                {
                  "from": "255700000000",
                  "id": "wamid.xxx",
                  "timestamp": "1234567890",
                  "type": "text",
                  "text": {
                    "body": "Hi, I need to track my order"
                  }
                }
              ]
            }
          }
        ]
      }
    ]
  }'
```

## Dashboard Testing

1. Open browser: `http://localhost:3000/dashboard`
2. View real-time statistics
3. Search orders by phone or name
4. Send manual messages
5. Monitor message history

## Performance Testing

### Test Cache Efficiency

1. Make multiple requests with same phone number
2. Monitor cache hit rate at `/api/stats`
3. Verify second request is faster

### Test Fuzzy Matching

Test with various name variations:
- "John" (should match "John Doe")
- "Jo" (low match - may not reach threshold)
- "Johnny D" (should match "John Doe")
- "Doe John" (reversed name)

### Load Testing

```bash
# Install Apache Bench (if not installed)
# macOS: brew install httpd
# Ubuntu: sudo apt-get install apache2-utils

# Test with 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:3000/api/health
```

## Troubleshooting

### 404 Not Found
- Verify endpoint URL is correct
- Check route is defined in API files

### 500 Internal Server Error
- Check server logs for error details
- Verify environment variables are set

### Missing Data
- Check internal order system is running
- Verify ORDER_SYSTEM_API_URL is correct
- Confirm API credentials are valid

### Slow Responses
- Check cache statistics
- Monitor network connectivity
- Review Render logs if deployed
