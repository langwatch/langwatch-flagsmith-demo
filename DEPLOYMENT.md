# Deployment Guide

This guide covers deploying the Banking Agent API to production.

## Prerequisites

- Node.js 18+ on your server
- Process manager (PM2 recommended)
- Reverse proxy (Nginx recommended)
- SSL certificate for HTTPS

## Environment Variables

Ensure these are set in your production environment:

```env
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=your_openai_api_key
LANGWATCH_API_KEY=your_langwatch_api_key
FLAGSMITH_CLIENT_KEY=UbqGod5LyVV57g8PEMirqU
FLAGSMITH_SERVER_KEY=ser.LqyzrPcXqZb9HLcHy92Zwb
```

## Deployment Options

### Option 1: Docker (Recommended)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["pnpm", "start"]
```

Build and run:

```bash
docker build -t banking-agent-api .
docker run -d -p 3000:3000 --env-file .env banking-agent-api
```

### Option 2: PM2

Install PM2:

```bash
npm install -g pm2
```

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'banking-agent-api',
    script: 'src/server.ts',
    interpreter: 'tsx',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Start the app:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 3: Systemd Service

Create `/etc/systemd/system/banking-agent.service`:

```ini
[Unit]
Description=Banking Agent API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/banking-agent
Environment="NODE_ENV=production"
EnvironmentFile=/opt/banking-agent/.env
ExecStart=/usr/bin/npx tsx src/server.ts
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable banking-agent
sudo systemctl start banking-agent
```

## Nginx Configuration

Create `/etc/nginx/sites-available/banking-agent`:

```nginx
upstream banking_agent {
    server localhost:3000;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # CORS (if needed)
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type" always;

    location / {
        proxy_pass http://banking_agent;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long-running AI requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/banking-agent /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Security Considerations

### 1. Rate Limiting

Add rate limiting to prevent abuse:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

### 2. Authentication

Add API key authentication:

```typescript
const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

app.use('/api/', authenticateApiKey);
```

### 3. Input Validation

Add input validation middleware:

```typescript
import { body, validationResult } from 'express-validator';

app.post('/api/chat', [
  body('customerId').isString().notEmpty(),
  body('message').isString().notEmpty().isLength({ max: 1000 }),
  body('threadId').optional().isString(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ... rest of the handler
});
```

## Monitoring

### LangWatch Integration

The API automatically sends traces to LangWatch. Monitor:

1. **Traces**: View all agent interactions
2. **Metrics**: Response time, token usage
3. **Errors**: Track and debug issues
4. **Costs**: Monitor OpenAI API costs

### Health Checks

Set up automated health checks:

```bash
# Using curl
*/5 * * * * curl -f http://localhost:3000/health || alert

# Using a monitoring service (e.g., UptimeRobot)
# Add http://yourdomain.com/health as a monitor
```

### Logging

Add structured logging:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log requests
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});
```

## Scaling

### Horizontal Scaling

1. **Load Balancer**: Use Nginx or AWS ALB
2. **Multiple Instances**: Run multiple Node.js processes
3. **Session Store**: Replace in-memory storage with Redis

Example with Redis:

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Store conversation
await redis.set(`conversation:${threadId}`, JSON.stringify(conversation));

// Retrieve conversation
const data = await redis.get(`conversation:${threadId}`);
const conversation = JSON.parse(data);
```

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Use Node.js cluster mode
- Enable HTTP/2

## Database Migration

For production, replace in-memory storage with a database:

### PostgreSQL Example

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Store conversation
await pool.query(
  'INSERT INTO conversations (thread_id, customer_id, messages) VALUES ($1, $2, $3)',
  [threadId, customerId, JSON.stringify(messages)]
);

// Retrieve conversation
const result = await pool.query(
  'SELECT * FROM conversations WHERE thread_id = $1',
  [threadId]
);
```

## Backup and Recovery

1. **Database Backups**: Automated daily backups
2. **Environment Variables**: Secure backup of secrets
3. **Code Repository**: Git with tagged releases
4. **Disaster Recovery**: Document recovery procedures

## CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test
      
      - name: Deploy to server
        run: |
          # Your deployment script here
          ssh user@server 'cd /opt/banking-agent && git pull && pnpm install && pm2 restart banking-agent-api'
```

## Troubleshooting

### High CPU Usage
- Check for memory leaks
- Monitor OpenAI API response times
- Review agent tool execution

### Memory Issues
- Implement conversation pruning
- Use external storage (Redis/DB)
- Monitor conversation history size

### Slow Responses
- Enable response caching for common queries
- Optimize prompt engineering
- Use faster OpenAI models for simple queries

## Support

For production issues:
1. Check LangWatch dashboard for errors
2. Review application logs
3. Monitor Flagsmith for feature flag states
4. Contact support team

---

**Remember**: Always test deployments in a staging environment first!
