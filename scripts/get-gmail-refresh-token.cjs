const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const destroyer = require('server-destroy');
require('dotenv').config();

// Get OAuth2 credentials from environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3001/oauth2callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env file');
  process.exit(1);
}

// Gmail API scope for sending emails
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

async function getRefreshToken() {
  // Dynamic import for open (ES module)
  const open = (await import('open')).default;
  
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  // Generate auth URL
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force to get refresh token
  });

  console.log('\n🔐 Gmail API Refresh Token Generator\n');
  console.log('1. Opening browser for authorization...');
  console.log('2. Authorize the application');
  console.log('3. You will be redirected back here\n');

  // Create a local server to receive the OAuth callback
  const server = http.createServer(async (req, res) => {
    try {
      if (req.url.indexOf('/oauth2callback') > -1) {
        const qs = new url.URL(req.url, 'http://localhost:3001').searchParams;
        const code = qs.get('code');

        res.end('✅ Authorization successful! You can close this window and return to the terminal.');

        // Exchange authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        console.log('\n✅ Success! Add these to your .env file:\n');
        console.log('GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
        console.log('\nAlso make sure you have:');
        console.log('GOOGLE_CLIENT_ID=' + CLIENT_ID);
        console.log('GOOGLE_CLIENT_SECRET=' + CLIENT_SECRET);
        console.log('\n');

        server.destroy();
      }
    } catch (e) {
      console.error('❌ Error:', e.message);
      server.destroy();
    }
  }).listen(3001, () => {
    console.log('🌐 Local server started on http://localhost:3001');
    console.log('📖 Opening browser...\n');
    open(authorizeUrl, { wait: false }).then(cp => cp.unref());
  });

  destroyer(server);
}

getRefreshToken().catch(console.error);
