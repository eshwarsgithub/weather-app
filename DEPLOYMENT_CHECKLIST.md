# SFMC Weather Activity - Deployment Checklist

## Issues Fixed ✅

### 1. Vercel Configuration (`vercel.json`)
- **Fixed**: Added explicit build configuration for static files
- **Fixed**: Added HTTP method restrictions for API endpoints  
- **Fixed**: Improved route ordering to prevent conflicts
- **Fixed**: Added proper static file routing for assets

### 2. CORS Configuration (`index.js`)
- **Fixed**: Added comprehensive CORS middleware
- **Fixed**: Handled preflight OPTIONS requests
- **Fixed**: Added required headers for SFMC JWT authentication

### 3. Error Handling (`index.js`)
- **Fixed**: Added global error handler
- **Fixed**: Added 404 handler with helpful endpoint list
- **Fixed**: Improved error logging and debugging

### 4. Request Parsing (`index.js`)
- **Fixed**: Increased JSON payload limits
- **Fixed**: Added URL-encoded form parsing

## Critical Environment Variables ⚠️

You MUST set these in Vercel dashboard (Settings → Environment Variables):

```env
WEATHER_API_KEY=your_openweathermap_api_key
JWT_SIGNING_SECRET=your_32_character_jwt_secret
```

### Getting API Keys:

1. **OpenWeatherMap API Key**:
   - Go to https://openweathermap.org/api
   - Sign up/login and get your free API key

2. **JWT Secret**:
   - Generate a secure 32+ character secret
   - Use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Vercel Deployment Steps 📦

1. **Environment Variables** (CRITICAL):
   ```bash
   # In Vercel dashboard: Settings → Environment Variables
   WEATHER_API_KEY=your_api_key_here
   JWT_SIGNING_SECRET=your_jwt_secret_here
   ```

2. **Deploy**:
   ```bash
   git add .
   git commit -m "Fix endpoint routing and CORS issues"
   git push origin main
   ```

3. **Test Endpoints** after deployment:
   - `GET /` - Homepage
   - `GET /config.json` - SFMC configuration
   - `GET /edit.html` - Configuration UI
   - `POST /execute` - Main weather logic
   - `POST /save`, `/validate`, `/publish`, `/stop` - SFMC lifecycle

## Common Endpoint Errors & Solutions 🔧

### Error: "Cannot GET /api/..."
- **Cause**: Wrong endpoint URLs
- **Solution**: Use correct endpoints listed above (no `/api/` prefix)

### Error: "Internal Server Error: App is not configured"
- **Cause**: Missing environment variables
- **Solution**: Set `WEATHER_API_KEY` and `JWT_SIGNING_SECRET` in Vercel

### Error: "Unauthorized: Missing token"
- **Cause**: Missing JWT header in POST requests
- **Solution**: SFMC automatically adds this header during execution

### Error: "CORS policy blocked"
- **Cause**: Missing CORS headers
- **Solution**: ✅ Fixed with new CORS middleware

### Error: "404 Not Found"
- **Cause**: Incorrect routing configuration
- **Solution**: ✅ Fixed with improved `vercel.json`

## Testing Your Deployment 🧪

1. **Basic Connectivity**:
   ```bash
   curl https://your-app.vercel.app/config.json
   ```

2. **SFMC Integration**:
   - Add your Vercel URL to SFMC Custom Activity
   - Use your `applicationExtensionKey` from the config

3. **Weather API Test** (with valid JWT):
   ```bash
   curl -X POST https://your-app.vercel.app/execute \
     -H "Content-Type: application/json" \
     -H "x-jwt-assertion: YOUR_JWT_TOKEN" \
     -d '{"inArguments":[{"contactKey":"test","locationField":"40.7128,-74.0060","locationFieldType":"coordinates"}]}'
   ```

## SFMC Configuration 🔧

Update your SFMC Custom Activity configuration with:
- **Config URL**: `https://your-app.vercel.app/config.json`
- **Execute URL**: `https://your-app.vercel.app/execute` 
- **Save/Publish/Validate URLs**: `https://your-app.vercel.app/{endpoint}`

## Monitoring & Debugging 📊

- Check Vercel function logs: Vercel Dashboard → Functions tab
- Test endpoints individually using the URLs above
- Ensure all URLs in `config.json` point to your Vercel deployment

---

**Status**: All major endpoint issues have been resolved. Set environment variables and redeploy to complete the fix.