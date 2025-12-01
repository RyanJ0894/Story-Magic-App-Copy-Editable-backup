import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';

const app = express();
app.use(cors());
app.use(express.json());

let connectionSettings: any = null;

async function getResendCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('Replit token not found');
  }

  if (!hostname) {
    throw new Error('REPLIT_CONNECTORS_HOSTNAME not found');
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );

  const data = await response.json();
  connectionSettings = data.items?.[0];

  if (!connectionSettings || !connectionSettings.settings?.api_key) {
    throw new Error('Resend not connected');
  }

  return { 
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email || 'Story Magic <onboarding@resend.dev>'
  };
}

app.post('/api/send-invitation', async (req, res) => {
  console.log('=== SEND INVITATION API CALLED ===');
  console.log('Request body:', req.body);

  try {
    const { email, role, token, inviterName, origin } = req.body;

    if (!email || !role || !token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: email, role, token' 
      });
    }

    const credentials = await getResendCredentials();
    console.log('Got Resend credentials, from email:', credentials.fromEmail);

    const resend = new Resend(credentials.apiKey);

    const invitationUrl = `${origin || 'https://story-magic.replit.app'}/accept-invitation?token=${token}`;
    console.log('Invitation URL:', invitationUrl);

    const emailResponse = await resend.emails.send({
      from: credentials.fromEmail,
      to: [email],
      subject: `You're invited to join Story Magic as ${role}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #2c5aa0; margin-bottom: 10px;">Story Magic</h1>
          <h2 style="color: #666; font-weight: normal; margin-top: 0;">Team Invitation</h2>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <p style="font-size: 18px; margin-bottom: 20px;">You've been invited by <strong>${inviterName || "a team member"}</strong> to join Story Magic as a <strong>${role}</strong>.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" style="background: #2c5aa0; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Accept Invitation</a>
          </div>
          
          <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="background: #e9ecef; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 14px;">${invitationUrl}</p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #666;">
          <p><strong>Important:</strong> This invitation expires in 7 days.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      </body>
      </html>
      `
    });

    console.log('Email sent successfully:', emailResponse);

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      return res.status(500).json({
        success: false,
        error: emailResponse.error.message || 'Failed to send email'
      });
    }

    return res.json({
      success: true,
      message: 'Invitation email sent successfully',
      emailId: emailResponse.data?.id,
      invitationUrl
    });

  } catch (error: any) {
    console.error('Error sending invitation:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send invitation email'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.API_PORT || 3001;

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export default app;
