# Quick Deploy to Render.com

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `anya-image-api`
3. Description: `Ultra-fast anime image search API`
4. **Public** (required for Render free tier)
5. **DO NOT** initialize with README
6. Click **Create repository**

## Step 2: Push Code

```bash
cd image-api

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/anya-image-api.git

# Push to GitHub
git push -u origin main
```

## Step 3: Deploy to Render

1. Go to https://dashboard.render.com/
2. Click **New +** → **Web Service**
3. Click **Connect to GitHub** → Authorize
4. Find `anya-image-api` → Click **Connect**
5. Settings will auto-fill:
   - **Name**: `anya-image-api` (or customize)
   - **Region**: Oregon (or closest to you)
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
6. Click **Create Web Service**

## Step 4: Wait for Deployment

- First deploy takes 2-3 minutes
- Watch the logs for any errors
- When you see "ANYA IMAGE API v1.0" it's ready!

## Step 5: Get Your URL

After deployment, you'll get a URL like:
```
https://anya-image-api.onrender.com
```

## Step 6: Update Bot

In your bot's environment, set:

```bash
# Windows PowerShell
$env:IMAGE_API_URL = "https://anya-image-api.onrender.com"

# Or create/edit .env file in bot directory
IMAGE_API_URL=https://anya-image-api.onrender.com
```

## Step 7: Test

```bash
# Test health
curl https://anya-image-api.onrender.com/health

# Test search
curl "https://anya-image-api.onrender.com/api/search?character=Anya&series=Spy+x+Family&limit=10"
```

## Done!

Your bot will now use the ultra-fast API automatically!

## Troubleshooting

**Build fails:**
- Check logs in Render dashboard
- Verify `package.json` exists in repo root
- Ensure Node version is 20+

**API not responding:**
- Free tier spins down after 15 min inactivity
- First request after spin-down takes ~30 seconds
- Use UptimeRobot to keep it alive (optional)

**Bot can't connect:**
- Verify `IMAGE_API_URL` is set correctly
- Check API health endpoint
- Bot will fall back to direct search if API is down
