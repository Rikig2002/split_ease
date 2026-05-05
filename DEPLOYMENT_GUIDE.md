# SplitEase Deployment Guide

## Architecture
- **Backend**: Express.js API on Render
- **Frontend**: React/Vite on Vercel
- **Database**: MongoDB Atlas (cloud)

---

## PART 1: SETUP MONGODB ATLAS (Required for both)

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (or login)
3. Create a free cluster:
   - Click "Create" → Select "M0 Free" tier
   - Choose cloud provider (AWS recommended)
   - Select region closest to users
   - Click "Create Cluster"

### Step 2: Create Database User
1. Go to "Security" → "Database Access"
2. Click "Add New Database User"
3. Create username & strong password
4. Set permissions to "Atlas admin"
5. **Save credentials** (you'll need them)

### Step 3: Whitelist IP Addresses
1. Go to "Security" → "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for production)
   - (Better: Add specific IPs for Render later)
4. Confirm

### Step 4: Get Connection String
1. Go to "Databases" → Click "Connect"
2. Choose "Drivers" → Node.js
3. Copy connection string:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/taskflow?retryWrites=true&w=majority
   ```
4. Replace USERNAME and PASSWORD with your credentials
5. Replace `taskflow` with your desired database name
6. **Save this string** - you'll use it for both Render and Vercel

---

## PART 2: DEPLOY BACKEND ON RENDER

### Step 1: Prepare Backend for Production

**1. Update server.js for Render:**
```javascript
// At top of server.js, add:
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// At bottom, change from:
// app.listen(5000, () => {...})

// To:
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
  console.log(`MongoDB: ${process.env.MONGO_URI ? 'Connected' : 'Connection string not set'}`);
});
```

**2. Ensure package.json has:**
```json
{
  "name": "splitease",
  "version": "1.0.0",
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  },
  "scripts": {
    "start": "node server.js",
    "start:prod": "cross-env NODE_ENV=production node server.js",
    "build": "vite build",
    "dev": "vite"
  }
}
```

### Step 2: Create Render Account & Connect Git

1. Go to https://render.com
2. Sign up (use GitHub/GitLab/Vercel account)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository:
   - Select repository
   - Allow Render to access it
   - Select branch: `main` (or your default branch)

### Step 3: Configure Render Web Service

**Setting name & region:**
- **Name**: `splitease-backend` (or your choice)
- **Region**: Choose closest to users
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm run start:prod`
- **Plan**: Free (or upgrade for no downtime)

### Step 4: Add Environment Variables on Render

Click "Environment" and add these variables:

```
MONGO_URI = mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/taskflow?retryWrites=true&w=majority
JWT_SECRET = your-super-secret-jwt-key-min-32-chars-xyz123456789
NODE_ENV = production
CLIENT_URLS = https://yourdomain-vercel.vercel.app,http://localhost:5200,http://localhost:5173
CLIENT_URL = https://yourdomain-vercel.vercel.app
PORT = (leave blank - Render sets automatically)
```

**Generate JWT_SECRET:**
```bash
# Run this locally, copy the output
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repo
   - Install dependencies
   - Build frontend (if build script present)
   - Start server
3. Wait for "Live" status (takes 2-3 minutes)
4. Click service URL to test API is running
5. **Save your Render backend URL**: `https://splitease-backend.onrender.com`

### Step 6: Test Backend is Live

Open browser and visit:
```
https://splitease-backend.onrender.com/api/auth/me
```

Should return error (since no token), but confirms API is responding.

---

## PART 3: DEPLOY FRONTEND ON VERCEL

### Step 1: Update Frontend Environment

**1. Create `.env.production` file in root:**
```env
VITE_API_BASE_URL = https://splitease-backend.onrender.com/api
```

**2. Ensure `vite.config.js` has:**
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5200,
    strictPort: true,
  },
})
```

**3. Update `src/services/api.js`:**
```javascript
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  timeout: 10000,
});
```

**4. In `package.json`, ensure:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Step 2: Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub (recommended)
3. Authorize Vercel to access your GitHub

### Step 3: Import Project to Vercel

1. Click "Add New..." → "Project"
2. Select your GitHub repository
3. Click "Import"

### Step 4: Configure Vercel Project

**Build Settings:**
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci` (or `npm install`)

### Step 5: Add Environment Variables

Click "Environment Variables" and add:

```
VITE_API_BASE_URL = https://splitease-backend.onrender.com/api
```

### Step 6: Deploy

1. Click "Deploy"
2. Vercel will:
   - Build your React app with Vite
   - Upload dist/ files to CDN
   - Show live URL
3. Wait for "Domains" section to show ✅
4. **Save your Vercel frontend URL**: `https://yourapp-vercel.vercel.app`

### Step 7: Test Frontend Works

1. Visit your Vercel URL
2. Click "Get Started" → Sign up
3. Should successfully create account
4. If error: Check browser Console (F12) for API errors

---

## PART 4: CONNECT FRONTEND & BACKEND

### Step 1: Update Backend CORS (Render)

Go back to Render:
1. Click your web service
2. Go to "Environment"
3. Update `CLIENT_URLS`:
   ```
   https://yourapp-vercel.vercel.app,http://localhost:5200,http://localhost:5173
   ```
4. Click "Update Environment"
5. Service will auto-redeploy

### Step 2: Test Full Integration

1. Open your Vercel frontend
2. Test signup → should work
3. Create a group
4. Create invite link
5. Test invite acceptance in new browser tab (private window)

---

## PART 5: CUSTOM DOMAIN (Optional)

### Add Custom Domain to Vercel

1. Go to Vercel Dashboard → Select project
2. Click "Settings" → "Domains"
3. Enter your domain (e.g., `splitease.com`)
4. Add DNS records (Vercel will show instructions)
5. Wait for DNS propagation (can take 24 hours)

### Add Custom Domain to Render (Optional)

1. Go to Render → Select web service
2. Click "Settings" → "Custom Domain"
3. Add domain (e.g., `api.splitease.com`)
4. Add DNS records
5. Update `CLIENT_URLS` to use new domain

---

## PART 6: MONITORING & TROUBLESHOOTING

### View Render Logs
- Go to service → "Logs" tab
- Check for errors during deployment

### View Vercel Logs
- Go to project → "Deployments" tab
- Click latest deployment
- Check "Functions" or "Build Logs"

### Common Issues

**Frontend can't reach backend:**
- Check `VITE_API_BASE_URL` is correct in Vercel env vars
- Check Render backend URL is live
- Check CORS: Verify your Vercel URL is in Render's `CLIENT_URLS`

**MongoDB connection failing:**
- Verify `MONGO_URI` is correct
- Check username/password has no special chars (or URL-encoded)
- Check IP whitelist on MongoDB Atlas includes Render IP

**Invite links not working:**
- Verify `CLIENT_URL` env var on Render is set to your Vercel URL
- Check invite link contains correct domain in URL

---

## PART 7: UPDATES & REDEPLOYMENT

### Deploy Backend Changes

**Option 1: Automatic (Recommended)**
1. Push code to GitHub
2. Render auto-redeploys on push to `main` branch

**Option 2: Manual**
1. Go to Render service
2. Click "Manual Deploy" button
3. Select branch
4. Wait for deployment

### Deploy Frontend Changes

**Option 1: Automatic (Recommended)**
1. Push code to GitHub
2. Vercel auto-redeploys on push to `main` branch

**Option 2: Manual**
1. Go to Vercel → Deployments
2. Find latest deployment
3. Click "Redeploy"

---

## COST SUMMARY (May 2026)

| Service | Free Tier | Cost |
|---------|-----------|------|
| MongoDB Atlas | 512 MB storage, 3 free clusters | Free |
| Render | $7/month Web Service, includes 750 hours | ~$7/month |
| Vercel | Unlimited deployments, 100 GB bandwidth | Free (Hobby) |
| **Total** | - | **~$7/month** |

---

## QUICK REFERENCE

### URLs After Deployment
- **Frontend**: https://yourapp-vercel.vercel.app
- **Backend API**: https://splitease-backend.onrender.com/api
- **MongoDB**: mongodb+srv://... (not public)

### Important Environment Variables

**Render (.env):**
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/taskflow
JWT_SECRET=your-32-char-secret
CLIENT_URL=https://yourapp-vercel.vercel.app
NODE_ENV=production
```

**Vercel (.env.production):**
```
VITE_API_BASE_URL=https://splitease-backend.onrender.com/api
```

---

## NEXT STEPS

1. ✅ Set up MongoDB Atlas cluster
2. ✅ Deploy backend to Render
3. ✅ Deploy frontend to Vercel
4. ✅ Test full flow
5. ✅ Add custom domain (optional)
6. ✅ Set up monitoring

**Questions?** Check logs in Render/Vercel dashboards for specific error messages.
