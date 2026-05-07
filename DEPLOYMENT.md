# Deployment Guide - Open Claw on Render

## Quick Start Deployment

### Step 1: GitHub Repository Setup
Your code is already pushed to: `https://github.com/AURA2324/open_-claw`

### Step 2: Deploy on Render.com

#### 1. Create Render Account
- Go to https://render.com
- Sign up or log in
- Connect your GitHub account

#### 2. Create New Web Service
1. Click "New +" > "Web Service"
2. Select repository: `open_-claw`
3. Configure settings:

**Basic Information:**
- Name: `open-claw`
- Environment: `Node`
- Region: Choose closest to Tanzania (EU or Africa if available)
- Build Command: `npm install`
- Start Command: `npm start`

**Environment Variables:**
Add the following in the Render Dashboard:

```
WHATSAPP_API_TOKEN=<your_whatsapp_business_api_token>
WHATSAPP_BUSINESS_ACCOUNT_ID=<your_business_account_id>
WHATSAPP_PHONE_NUMBER_ID=<your_phone_number_id>
WHATSAPP_VERIFY_TOKEN=<your_verify_token>
ORDER_SYSTEM_API_URL=<your_order_system_url>
ORDER_SYSTEM_API_KEY=<your_api_key>
NODE_ENV=production
PORT=3000
```

#### 3. WhatsApp Webhook Configuration

After deployment, Render will provide you with a URL like:
```
https://open-claw-xxxx.onrender.com
```

**Configure WhatsApp webhook:**
1. Go to Meta App Dashboard
2. Settings > Configuration
3. Webhook URL: `https://open-claw-xxxx.onrender.com/api/webhooks/whatsapp`
4. Verify Token: Use the same token as `WHATSAPP_VERIFY_TOKEN`
5. Subscribe to: `messages`, `message_status`

#### 4. Access Your Application

- **Dashboard**: `https://open-claw-xxxx.onrender.com/dashboard`
- **API Docs**: `https://open-claw-xxxx.onrender.com/api/docs`
- **Health Check**: `https://open-claw-xxxx.onrender.com/api/health`

## API Endpoints

### Webhooks
- `GET /api/webhooks/whatsapp` - Webhook verification
- `POST /api/webhooks/whatsapp` - Receive messages

### Order Matching
- `POST /api/orders/match-by-phone` - Priority 1: Phone matching
- `POST /api/orders/match-by-name` - Priority 2: Fuzzy name matching
- `POST /api/orders/match-full` - Full matching with priority
- `GET /api/orders/:orderId` - Get order details

### Messages
- `GET /api/messages` - Message history
- `POST /api/messages/send` - Send manual message
- `POST /api/messages/send-group` - Send group message

### Statistics
- `GET /api/stats` - System statistics
- `GET /api/health` - Health check

## Testing Locally

### Prerequisites
- Node.js 18+
- npm

### Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env

# Install dependencies
npm install

# Start development server
npm run dev
```

Server will run on `http://localhost:3000`

## Order Matching Logic

### Priority 1: Exact Phone Number Match
- Extract phone from WhatsApp message sender
- Query internal order system
- Return: Customer name + IMEI

### Priority 2: Fuzzy Customer Name Match
- If no phone match found
- Use customer name from group message
- Apply 60% similarity threshold
- Return: Top 1-2 most similar orders

### Scenario 3: No Match
- Reply with: "The system fails to match the order. Please recheck the customer name or customer phone number."

## Key Features

✅ **Tanzania Phone Support**: Full +255 prefix handling
✅ **Token Optimization**: Intelligent caching to reduce API costs
✅ **Automatic Replies**: Smart group message responses
✅ **Dashboard**: Real-time monitoring and message history
✅ **Error Handling**: Comprehensive logging and recovery
✅ **Scalable**: Production-ready on Render.com

## Performance Optimization

1. **Response Caching**: 1-hour cache for order queries
2. **Batch Processing**: Efficient message handling
3. **Database Indexing**: Fast phone number lookups
4. **Connection Pooling**: Optimized API calls

## Monitoring

Access the dashboard at:
```
https://open-claw-xxxx.onrender.com/dashboard
```

Monitor:
- Real-time messages
- Order matching results
- System statistics
- Cache performance
- Message history

## Troubleshooting

### Messages not being received
1. Verify WhatsApp webhook URL is correct
2. Check webhook token matches
3. Verify phone number ID is correct
4. Check error logs in Render dashboard

### Orders not matching
1. Verify ORDER_SYSTEM_API_URL is accessible
2. Check ORDER_SYSTEM_API_KEY is valid
3. Verify phone number format (must be +255 prefix)
4. Check order system database has data

### Slow responses
1. Check cache hit rate in stats
2. Monitor order system API response time
3. Review Render logs for errors
4. Verify network connectivity

## Support

For issues:
1. Check Render logs: Dashboard > Logs
2. Check application health: `/api/health`
3. Review API docs: `/api/docs`
4. Monitor system stats: `/api/stats`

## Next Steps

1. ✅ Push code to GitHub: Done
2. ⏳ Deploy to Render: Follow Step 2 above
3. ⏳ Configure WhatsApp webhook
4. ⏳ Connect internal order system
5. ⏳ Test with live WhatsApp messages
6. ⏳ Monitor and optimize
