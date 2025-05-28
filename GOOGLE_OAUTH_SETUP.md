# Google OAuth Setup Guide for Eterny React Native App

## ✅ What's Already Configured

### Backend Setup (Complete)
- ✅ Google OAuth credentials in `server/.env`
- ✅ Passport.js Google Strategy configured
- ✅ New mobile endpoint `/auth/google/mobile` created
- ✅ Google Auth Library installed for token verification
- ✅ User creation and seeding logic implemented

### Mobile App Setup (Complete)
- ✅ Google Sign-In library already installed
- ✅ LoginScreen updated with proper configuration
- ✅ Authentication flow integrated with backend
- ✅ Error handling implemented

### Android Configuration (Partial)
- ✅ Google Services plugin added to build.gradle files
- ✅ SHA-1 fingerprint identified: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- ⚠️ Need to complete Google Cloud Console setup

## 🔧 What You Need to Do

### Step 1: Complete Google Cloud Console Setup

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

2. **Create/Select Project**
   - Create a new project or select existing one
   - Note your PROJECT_ID

3. **Enable APIs**
   - Go to **APIs & Services > Library**
   - Search and enable: **Google Sign-In API**

4. **Configure OAuth Consent Screen**
   - Go to **APIs & Services > OAuth consent screen**
   - Choose **External** user type
   - Fill in:
     - **App name**: Eterny
     - **User support email**: Your email
     - **Developer contact information**: Your email
   - Add scopes: `email`, `profile`, `openid`

5. **Create Android OAuth Client**
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth 2.0 Client ID**
   - Select **Android** application type
   - Enter:
     - **Name**: Eterny Android
     - **Package name**: `com.eterny`
     - **SHA-1 certificate fingerprint**: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

6. **Update google-services.json**
   - Download the `google-services.json` file from your Android OAuth client
   - Replace the template file at `app/android/app/google-services.json`

### Step 2: Test the Integration

1. **Restart Metro bundler**:
   ```bash
   cd app
   npx react-native start --reset-cache
   ```

2. **Rebuild the Android app**:
   ```bash
   cd app
   npx react-native run-android
   ```

3. **Test Google Sign-In**:
   - Open the app on emulator
   - Tap "Continue with Google"
   - Complete the OAuth flow

## 🔍 Current Configuration Details

### Backend Environment (server/.env)
```env
GOOGLE_CLIENT_ID=y231231514086-1ltso6j58bnd6t8510tuf32j3jmbd0dk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### Mobile App Configuration
- **Web Client ID**: `y231231514086-1ltso6j58bnd6t8510tuf32j3jmbd0dk.apps.googleusercontent.com`
- **Package Name**: `com.eterny`
- **SHA-1 Fingerprint**: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

### API Endpoints
- **Mobile OAuth**: `POST /auth/google/mobile`
- **Web OAuth**: `GET /auth/google` (existing)
- **Demo Login**: `POST /auth/dummy-login` (fallback)

## 🐛 Troubleshooting

### Common Issues:
1. **"Sign-in failed"**: Check if Google Services are properly configured
2. **"Invalid client"**: Verify SHA-1 fingerprint matches exactly
3. **"Network error"**: Ensure backend server is running on port 5001
4. **"Token verification failed"**: Check client ID configuration

### Debug Commands:
```bash
# Check server status
curl http://localhost:5001/auth/status

# Test mobile endpoint (will fail with invalid token, but should return 400 not 500)
curl -X POST http://localhost:5001/auth/google/mobile -H "Content-Type: application/json" -d '{"idToken":"test"}'

# Check Android build
cd app && npx react-native run-android --verbose
```

## 🎯 Expected Flow

1. User taps "Continue with Google"
2. Google Sign-In SDK opens OAuth flow
3. User completes authentication
4. App receives ID token and access token
5. App sends tokens to `/auth/google/mobile`
6. Backend verifies token with Google
7. Backend creates/updates user and returns JWT
8. App stores JWT and navigates to main screen

## 📝 Next Steps After OAuth Works

1. **Remove Demo Login**: Once Google OAuth is working, remove the demo login button
2. **Add Error Analytics**: Implement proper error tracking
3. **Add Logout Flow**: Implement Google Sign-Out
4. **Production Setup**: Configure production keystore and OAuth clients 