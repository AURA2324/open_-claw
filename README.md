# Open Claw - WhatsApp Automation Agent

A production-ready WhatsApp automation agent that integrates with internal order systems to provide intelligent order matching and automatic replies in WhatsApp groups.

## Features

- 🤖 **Real-time WhatsApp Integration**: Connects to Meta WhatsApp Business API
- 🔍 **Intelligent Order Matching**: 
  - Priority 1: Exact phone number matching
  - Priority 2: Fuzzy customer name matching
- 📱 **Automatic Group Replies**: Smart responses based on matching results
- 💾 **Token Optimization**: Caching and efficient API calls to minimize costs
- 📊 **Web Dashboard**: Monitor and manage WhatsApp messages and orders
- 🌍 **Tanzania Support**: Full +255 phone number prefix support

## Core Matching Rules

### Priority 1: Phone Number Matching
- Extracts sender phone number from WhatsApp message
- Performs precise query against internal order system
- Returns exact customer name and IMEI

### Priority 2: Fuzzy Customer Name Matching
- If no phone number match, uses customer name from WhatsApp group
- Implements similarity matching for abbreviations and aliases
- Returns top 1-2 similar orders for manual verification

### Auto-Reply Scenarios
- **Scenario 1 (Exact Match)**: Auto-reply with customer name and IMEI
- **Scenario 2 (Fuzzy Match)**: Reply with top 1-2 results for confirmation
- **Scenario 3 (No Match)**: Standard message: "The system fails to match the order. Please recheck the customer name or customer phone number."

## Tech Stack

- **Backend**: Node.js + Express.js
- **API**: Meta WhatsApp Business API v18.0
- **Database**: Flexible (SQL/NoSQL)
- **Deployment**: Render.com
- **Cache**: Node-cache (token optimization)

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`
2. Fill in your credentials:
   ```bash
   cp .env.example .env
   ```
3. Configure the following:
   - WhatsApp Business API credentials
   - Internal order system connection
   - Server port (default: 3000)

## Environment Variables

```
WHATSAPP_API_TOKEN        - Meta WhatsApp Business API token
WHATSAPP_PHONE_NUMBER_ID  - Your WhatsApp Phone Number ID
WHATSAPP_VERIFY_TOKEN     - Webhook verification token
ORDER_SYSTEM_API_URL      - Internal order system API endpoint
ORDER_SYSTEM_API_KEY      - Internal order system API key
PORT                      - Server port (default: 3000)
```

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### WhatsApp Webhook
- **POST** `/api/webhooks/whatsapp` - Receive WhatsApp messages
- **GET** `/api/webhooks/whatsapp` - Webhook verification

### Order Endpoints
- **POST** `/api/orders/match-by-phone` - Match order by phone number
- **POST** `/api/orders/match-by-name` - Fuzzy match by customer name
- **GET** `/api/orders/:orderId` - Get order details
- **GET** `/api/stats` - Get system statistics

### Messages
- **GET** `/api/messages` - Get message history
- **POST** `/api/messages/send` - Send manual WhatsApp message

## Web Dashboard

Access the dashboard at `http://localhost:3000/dashboard`

Features:
- Real-time message monitoring
- Order matching status
- System statistics and metrics
- Token consumption tracking
- Manual message sending

## Project Structure

```
open-claw/
├── src/
│   ├── server.js           - Main Express server
│   ├── api/
│   │   ├── webhooks.js     - WhatsApp webhook handlers
│   │   ├── orders.js       - Order matching API
│   │   └── messages.js     - Message management API
│   ├── services/
│   │   ├── whatsapp.js     - WhatsApp Business API client
│   │   ├── orderSystem.js  - Internal order system integration
│   │   ├── matcher.js      - Order matching engine
│   │   └── cache.js        - Caching service
│   └── utils/
│       ├── logger.js       - Logging utility
│       ├── validators.js   - Input validation
│       └── config.js       - Configuration manager
├── public/
│   ├── index.html          - Dashboard HTML
│   ├── dashboard.js        - Dashboard JavaScript
│   └── styles.css          - Dashboard styles
├── package.json
├── .env.example
└── README.md
```

## Performance Optimization

- **Token Caching**: 1-hour cache for order queries to minimize API calls
- **Fuzzy Matching Cache**: Cached similarity scores
- **Batch Processing**: Groups multiple WhatsApp messages for efficient processing
- **Efficient Queries**: Indexed phone number searches

## Error Handling

The system implements comprehensive error handling:
- WhatsApp API failures trigger fallback messages
- Order system timeouts don't block message processing
- Failed matches default to "no match" scenario
- Detailed logs for debugging and monitoring

## Deployment on Render

1. Push code to GitHub: `https://github.com/AURA2324/open_-claw`
2. Connect repository to Render.com
3. Set environment variables in Render dashboard
4. Deploy and verify webhook URL

## Support & Maintenance

For issues or feature requests, contact the development team.

## License

© 2024 Open Claw Automation System
