# GitHub Repository Setup

## 1. Create GitHub Repository

1. Go to [GitHub](https://github.com) and click **"New repository"**
2. Repository name: `anya-image-api`
3. Description: `Ultra-fast anime image search API with intelligent rate limiting`
4. Make it **Public** (required for Render free tier)
5. **DO NOT** initialize with README (we already have one)
6. Click **"Create repository"**

## 2. Push to GitHub

```bash
# Copy these commands after creating the repo
git remote add origin https://github.com/YOUR_USERNAME/anya-image-api.git
git branch -M main
git push -u origin main
```

## 3. Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. **Connect to GitHub** → Authorize
4. Find and select `anya-image-api`
5. Configure:
   - Name: `anya-image-api`
   - Region: Oregon (or closest)
   - Branch: `main`
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free
6. Click **"Create Web Service"**

## 4. After Deployment

Your API will be available at:
```
https://anya-image-api.onrender.com
```

## 5. Update Bot

Set environment variable for your bot:
```bash
# Windows PowerShell
$env:IMAGE_API_URL = "https://anya-image-api.onrender.com"

# Or add to .env file
IMAGE_API_URL=https://anya-image-api.onrender.com
```

## 6. Test API

```bash
# Test health endpoint
curl https://anya-image-api.onrender.com/health

# Test search
curl "https://anya-image-api.onrender.com/api/search?character=Anya&series=Spy+x+Family"
```

## Notes

- First deployment takes 2-3 minutes
- Cold starts take ~30 seconds (free tier limitation)
- API will auto-restart if it crashes
- Logs available in Render dashboard
