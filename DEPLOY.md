# Deploying to Render.com

## Prerequisites
- GitHub account
- Render.com account (free tier works)

## Deployment Steps

### 1. Push to GitHub

```bash
cd image-api
git init
git add .
git commit -m "Initial commit: Anya Image API"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/anya-image-api.git
git push -u origin main
```

### 2. Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `anya-image-api`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: Leave empty (or `image-api` if in monorepo)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Click **"Create Web Service"**

### 3. Configure Environment Variables

In Render dashboard, go to **Environment** tab and add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` (auto-set by Render) |

### 4. Get Your API URL

After deployment completes, you'll get a URL like:
```
https://anya-image-api.onrender.com
```

### 5. Update Python Bot

Update `bot/utils/cogs/game/draw/api_client.py`:

```python
# Change this line:
API_BASE_URL = "http://localhost:3456"

# To your Render URL:
API_BASE_URL = "https://anya-image-api.onrender.com"
```

## Health Check

Render will automatically ping `/health` to verify the service is running.

Test manually:
```bash
curl https://anya-image-api.onrender.com/health
```

## Performance Notes

**Free Tier Limitations:**
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds (cold start)
- 750 hours/month free (enough for continuous uptime)

**Optimization:**
- Cache persists during uptime (2-hour TTL)
- Rate limiting prevents API abuse
- Compression reduces bandwidth usage

## Monitoring

View logs in Render dashboard:
- **Logs** tab shows real-time output
- **Metrics** tab shows CPU/memory usage
- **Events** tab shows deployment history

## Troubleshooting

**Service won't start:**
- Check logs for errors
- Verify Node version (20+)
- Ensure all dependencies installed

**Slow responses:**
- Cold start after inactivity (normal)
- Check rate limiting logs
- Verify source APIs are accessible

**Memory issues:**
- Free tier has 512MB RAM
- Cache size is limited (500 searches)
- LRU eviction handles overflow

## Alternative: Keep-Alive

To prevent cold starts, use a service like [UptimeRobot](https://uptimerobot.com/) to ping your API every 5 minutes:

```
https://anya-image-api.onrender.com/health
```

## Cost Optimization

**Stay on Free Tier:**
- 750 hours/month = 31.25 days continuous
- Use for bot only (not public API)
- Cache reduces external API calls

**Upgrade if needed:**
- Starter: $7/month (always on, no cold starts)
- Standard: $25/month (more resources)
