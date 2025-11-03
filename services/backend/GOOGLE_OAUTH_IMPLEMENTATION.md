# Google OAuth Implementation Guide

## Overview
Satya now supports Google OAuth 2.0 authentication using Passport.js. Users can sign in or register using their Google account.

## Architecture

### Backend Flow
1. **Initiation**: User clicks "Continue with Google" → Frontend redirects to `GET /api/auth/google`
2. **OAuth Flow**: Backend redirects to Google's OAuth consent screen
3. **Callback**: Google redirects to `GET /api/auth/google/callback` with authorization code
4. **User Creation/Linking**:
   - If Google account exists → Update last login
   - If email exists (email/password user) → Link Google account
   - If new user → Create account with Google profile data
5. **Token Generation**: Backend generates JWT token
6. **Frontend Redirect**: Backend redirects to `http://localhost:5173/auth/callback?token=<JWT>`
7. **Token Storage**: Frontend extracts token, stores in localStorage, fetches user data

### User Model Changes
The `User` model supports multiple auth providers:
- `authProvider`: `"email"` | `"google"` | `"clerk"` | `"firebase"`
- `googleId`: Stores Google account ID for linking
- `isEmailVerified`: Auto-set to `true` for Google users (Google verifies emails)
- `profilePic`: Can be set from Google profile photo

## Setup Instructions

### 1. Google Cloud Console Configuration
Already configured with:
- **Authorized JavaScript origins**:
  - `http://localhost:5173` (Frontend)
  - `http://localhost:3000` (Pipeline)
- **Authorized redirect URIs**:
  - `http://localhost:3000/api/auth/google/callback` (Backend callback)

For production, add:
- `https://yourdomain.com`
- `https://api.yourdomain.com/api/auth/google/callback`

### 2. Environment Variables
Add to `Satya_backend/.env`:
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Frontend URL (for OAuth redirect)
FRONTEND_URL=http://localhost:5173
```

### 3. Dependencies
Already installed in `services/backend/package.json`:
```json
{
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0"
}
```

## API Endpoints

### `GET /api/auth/google`
**Description**: Initiates Google OAuth flow  
**Scope**: `profile`, `email`  
**Returns**: Redirects to Google consent screen

### `GET /api/auth/google/callback`
**Description**: Handles OAuth callback from Google  
**Success**: Redirects to `FRONTEND_URL/auth/callback?token=<JWT>`  
**Failure**: Redirects to `FRONTEND_URL/login?error=<error_code>`

**Error Codes**:
- `oauth_failed`: Passport authentication failed
- `no_user`: User object not found after auth
- `callback_failed`: Server error during callback

## Frontend Implementation

### New Page: `OAuthCallbackPage.jsx`
Handles OAuth redirect and token extraction:
1. Extracts `token` or `error` from URL params
2. Stores token in localStorage
3. Fetches user data from `/api/auth/me`
4. Updates AuthContext
5. Redirects to homepage or shows error

### Updated Components
- **LoginPage.jsx**: Added `handleGoogleLogin()` function
- **RegisterPage.jsx**: Added `handleGoogleSignup()` function
- **App.jsx**: Added route `/auth/callback`

### Button Implementation
```jsx
const handleGoogleLogin = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  window.location.href = `${apiUrl}/api/auth/google`;
};
```

## Security Features

### Account Linking
If a user registers with email/password then tries to sign in with Google:
- System checks if email already exists
- Links Google account to existing user
- Updates `authProvider` to `"google"`
- Sets `isEmailVerified` to `true`
- Preserves user data (bio, profile pic, interests)

### Email Verification
- Google users: `isEmailVerified` automatically set to `true`
- Email/password users: Must verify email before login
- Linking Google to email account: Marks email as verified

### JWT Token Security
- Tokens expire after 7 days (configurable via `JWT_EXPIRES_IN`)
- Stored in localStorage (frontend)
- Sent via `Authorization: Bearer <token>` header

## User Experience

### New User (Google Sign-In)
1. Click "Continue with Google"
2. Google consent screen → Grant permissions
3. Automatically redirected to homepage
4. Email pre-verified, profile picture set

### Existing User (Link Google)
1. User registered with email/password
2. Click "Continue with Google" with same email
3. Google account linked to existing profile
4. Can now sign in with either method
5. Email marked as verified

### Existing Google User
1. Click "Continue with Google"
2. Instantly signed in (no password needed)
3. Last login timestamp updated

## Testing

### Manual Testing
1. Start backend: `cd Satya_backend/services/backend && npm run dev`
2. Start frontend: `cd Satya_frontend && npm run dev`
3. Navigate to `http://localhost:5173/login`
4. Click "Continue with Google"
5. Complete Google sign-in
6. Should redirect to homepage with user authenticated

### Test Scenarios
- ✅ New user registration via Google
- ✅ Existing email/password user linking Google
- ✅ Existing Google user login
- ✅ Profile picture from Google
- ✅ Auto email verification
- ✅ Error handling (cancelled OAuth, network errors)

## Troubleshooting

### "Redirect URI mismatch"
- Ensure callback URL in Google Console matches exactly: `http://localhost:3000/api/auth/google/callback`
- Check `FRONTEND_URL` environment variable

### "User not authenticated after OAuth"
- Check browser console for errors in `OAuthCallbackPage`
- Verify JWT token in localStorage
- Check backend logs for token generation

### "Profile picture not loading"
- Google profile URLs expire after ~2 hours
- Consider uploading to Cloudinary on first login
- Update `profilePic` field after upload

## Future Enhancements
- [ ] Upload Google profile pictures to Cloudinary
- [ ] Add Facebook/Twitter OAuth
- [ ] Implement refresh tokens
- [ ] Add OAuth session management
- [ ] Support multiple linked accounts per user

## Files Modified

### Backend
- ✅ `services/backend/src/config/passport.ts` (NEW)
- ✅ `services/backend/src/routes/auth.ts` (UPDATED)
- ✅ `services/backend/src/index.ts` (UPDATED)
- ✅ `services/backend/src/models/User.js` (UPDATED - already had googleId field)

### Frontend
- ✅ `Satya_frontend/src/pages/OAuthCallbackPage.jsx` (NEW)
- ✅ `Satya_frontend/src/pages/LoginPage.jsx` (UPDATED)
- ✅ `Satya_frontend/src/pages/RegisterPage.jsx` (UPDATED)
- ✅ `Satya_frontend/src/App.jsx` (UPDATED)

## Environment Variables Summary

### Required
```bash
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
FRONTEND_URL=http://localhost:5173
```

### Optional (Already Configured)
```bash
JWT_SECRET=<your-secret-key>
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```
