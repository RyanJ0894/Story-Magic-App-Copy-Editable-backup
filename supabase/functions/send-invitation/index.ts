import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import { Resend } from 'npm:resend@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  email: string;
  role: string;
  token: string;
  inviterName?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  console.log('=== SEND-INVITATION FUNCTION STARTED v2.0 ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Parsing request body...');
    const requestBody = await req.text();
    console.log('Raw request body:', requestBody);
    
    const { email, role, token, inviterName }: InvitationRequest = JSON.parse(requestBody);
    console.log('Parsed request data:', { email, role, token: token?.substring(0, 10) + '...', inviterName });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the current domain for the invitation link - use the Supabase URL for consistency
    const baseUrl = Deno.env.get('SUPABASE_URL') || 'https://bcuhyyyerxwgkrkbrqbs.supabase.co';
    const invitationUrl = `${baseUrl.replace('/rest/v1', '')}/accept-invitation?token=${token}`;

    console.log('Sending invitation email:', { email, role, invitationUrl });

    // Store invitation details in database (this should already be done by the client)
    // This is just for logging/verification
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError) {
      console.error('Invitation not found:', inviteError);
      throw new Error('Invitation not found');
    }

    // Get and validate the actual API key
    const apiKey = Deno.env.get('RESEND_API_KEY');
    console.log('RESEND_API_KEY validation:', {
      exists: !!apiKey,
      format: apiKey?.startsWith('re_') ? 'VALID' : 'INVALID',
      length: apiKey?.length || 0
    });

    if (!apiKey || !apiKey.startsWith('re_')) {
      console.error('Invalid RESEND_API_KEY: must start with "re_"');
      throw new Error('Invalid or missing RESEND_API_KEY');
    }

    console.log('Making direct Resend API call...');
    
    const emailHtml = `
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
          <p style="font-size: 18px; margin-bottom: 20px;">You've been invited by <strong>${inviterName || 'a team member'}</strong> to join Story Magic as a <strong>${role}</strong>.</p>
          
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
    `;

    // Use direct fetch call to Resend API as requested
    try {
      console.log('Making direct fetch call to Resend API with:', {
        from: "Story Magic <onboarding@resend.dev>",
        to: email,
        subject: `You're invited to join our team as ${role}`,
        apiKeyLength: apiKey?.length,
        apiKeyPrefix: apiKey?.substring(0, 5)
      });

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Story Magic <onboarding@resend.dev>', // Using resend.dev domain as requested
          to: [email],
          subject: `You're invited to join our team as ${role}`,
          html: emailHtml
        })
      });

      console.log('Resend fetch response status:', response.status);
      console.log('Resend fetch response headers:', Object.fromEntries(response.headers.entries()));

      const responseData = await response.json();
      console.log('Resend success:', responseData);

      if (!response.ok) {
        console.log('Resend error details:', responseData.message, responseData);
        throw new Error(`Resend API error: ${responseData.message || 'Unknown error'}`);
      }

      console.log('Email sent successfully! Response:', responseData);
      
    } catch (resendError: any) {
      console.error('=== RESEND API CALL FAILED ===');
      console.error('Error name:', resendError.name);
      console.error('Error message:', resendError.message);
      console.error('Error code/status:', resendError.code || resendError.statusCode);
      console.error('Full Resend error:', resendError);
      
      // Re-throw with more specific message
      throw new Error(`Failed to send email via Resend: ${resendError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation prepared successfully',
        invitationUrl // Return URL for testing
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("=== ERROR IN SEND-INVITATION FUNCTION ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error object:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});