import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // It's important to use a real site key for your domain in production
  const siteKey = '6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-'; // Example site key

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>reCAPTCHA Verification</title>
        <script src="https://www.google.com/recaptcha/api.js" async defer></script>
        <style>
            body, html {
                height: 100%;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #333;
            }
            .container {
                text-align: center;
                background: white;
                padding: 2rem;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                max-width: 400px;
                width: 90%;
            }
            .title {
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 1rem;
                color: #2d3748;
            }
            .subtitle {
                font-size: 0.9rem;
                color: #718096;
                margin-bottom: 2rem;
                line-height: 1.4;
            }
            #message {
                margin-top: 20px;
                font-size: 1.1em;
                color: #48bb78;
                font-weight: 500;
            }
            .loading {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-right: 10px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
        <script>
            function onCaptchaSuccess(token) {
                console.log("Captcha solved successfully!");
                
                // Display success message
                document.getElementById('recaptcha-widget').style.display = 'none';
                document.getElementById('message').innerHTML = '✅ Verification successful! Please click "I\'ve Solved the Captcha" button above.';
                
                // Notify parent window (optional - we rely on the button click now)
                window.parent.postMessage({
                    type: 'captcha-solved',
                    token: token
                }, '*');
            }
            
            function onCaptchaExpired() {
                document.getElementById('message').innerHTML = '⏰ Captcha expired. Please try again.';
            }
            
            function onCaptchaError() {
                document.getElementById('message').innerHTML = '❌ Error loading captcha. Please refresh the page.';
            }
        </script>
    </head>
    <body>
        <div class="container">
            <div class="title">Security Verification</div>
            <div class="subtitle">Please complete the reCAPTCHA below to continue fetching data from Google Trends.</div>
            <div id="recaptcha-widget">
               <div class="g-recaptcha" 
                    data-sitekey="${siteKey}" 
                    data-callback="onCaptchaSuccess"
                    data-expired-callback="onCaptchaExpired"
                    data-error-callback="onCaptchaError"></div>
            </div>
            <div id="message"></div>
        </div>
    </body>
    </html>
  `;

  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
