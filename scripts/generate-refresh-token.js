const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');

const GAD_CREDENTIAL_PATH = path.join(process.cwd(), 'gad-credential.json');
const PORT = 3001;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

async function main() {
  const { default: open } = await import('open');
  try {
    const credentialsRaw = fs.readFileSync(GAD_CREDENTIAL_PATH, 'utf-8');
    const credentials = JSON.parse(credentialsRaw);
    const { client_id, client_secret } = credentials;

    const oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      REDIRECT_URI
    );

    const scopes = ['https://www.googleapis.com/auth/adwords'];

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });

    console.log(
      '🔑 Please open this URL in your browser to authorize the application:'
    );
    console.log(authorizationUrl);
    open(authorizationUrl);

    const server = http.createServer(async (req, res) => {
      try {
        if (req.url.indexOf('/oauth2callback') > -1) {
          const qs = new url.URL(req.url, `http://localhost:${PORT}`)
            .searchParams;
          const code = qs.get('code');
          res.end('Authentication successful! Please return to the console.');
          server.close();

          const { tokens } = await oauth2Client.getToken(code);
          console.log('\n✅ Authentication successful!\n');
          console.log(
            'Your refresh token is (copy this to gcs-credential.json):'
          );
          console.log(`"refresh_token": "${tokens.refresh_token}",`);
        }
      } catch (e) {
        console.error(e);
        res.end('Authentication failed');
        server.close();
      }
    });

    server.listen(PORT, () => {
      console.log(
        `\n👂 Waiting for authentication callback on port ${PORT}...`
      );
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main().catch(console.error);
