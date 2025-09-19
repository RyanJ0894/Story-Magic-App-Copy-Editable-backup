import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
Deno.serve(async (req)=>{
  console.log('=== SEND-INVITATION FUNCTION STARTED v3.0 ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    console.log('Parsing request body...');
    const requestBody = await req.text();
    console.log('Raw request body:', requestBody);
    const requestData = JSON.parse(requestBody);
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Check if this is an invitation acceptance request (has password field)
    if (requestData.password) {
      console.log('=== HANDLING INVITATION ACCEPTANCE ===');
      return await handleInvitationAcceptance(requestData, supabase);
    } else {
      console.log('=== HANDLING INVITATION SENDING ===');
      return await handleInvitationSending(requestData, supabase);
    }
  } catch (error) {
    console.error("=== ERROR IN SEND-INVITATION FUNCTION ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error object:", error);
    return new Response(JSON.stringify({
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
async function handleInvitationSending(data, supabase) {
  const { email, role, token, inviterName } = data;
  console.log('Parsed request data:', {
    email,
    role,
    token: token?.substring(0, 10) + '...',
    inviterName
  });
  // Use your actual app domain for the invitation link
  const baseUrl = 'https://storymagicapp.net';
  const invitationUrl = `${baseUrl}/accept-invitation?token=${token}`;
  console.log('Sending invitation email:', {
    email,
    role,
    invitationUrl
  });
  // Store invitation details in database (this should already be done by the client)
  // This is just for logging/verification
  const { data: invitation, error: inviteError } = await supabase.from('team_invitations').select('*').eq('token', token).single();
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
      from: "Story Magic <noreply@storymagicapp.net>",
      to: email,
      subject: `You're invited to join our team as ${role}`,
      apiKeyLength: apiKey?.length,
      apiKeyPrefix: apiKey?.substring(0, 5)
    });
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Story Magic <noreply@storymagicapp.net>',
        to: [
          email
        ],
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
  } catch (resendError) {
    console.error('=== RESEND API CALL FAILED ===');
    console.error('Error name:', resendError.name);
    console.error('Error message:', resendError.message);
    console.error('Error code/status:', resendError.code || resendError.statusCode);
    console.error('Full Resend error:', resendError);
    // Re-throw with more specific message
    throw new Error(`Failed to send email via Resend: ${resendError.message}`);
  }
  return new Response(JSON.stringify({
    success: true,
    message: 'Invitation prepared successfully',
    invitationUrl
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}
async function handleInvitationAcceptance(data, supabase) {
  const { token, email, password } = data;
  console.log('Accepting invitation for:', {
    email,
    token: token?.substring(0, 10) + '...'
  });
  try {
    // 1. Verify the invitation token exists and is valid
    const { data: invitation, error: inviteError } = await supabase.from('team_invitations').select('*, master_accounts(*)').eq('token', token).eq('email', email).eq('status', 'pending').single();
    if (inviteError || !invitation) {
      console.error('Invalid or expired invitation:', inviteError);
      throw new Error('Invalid or expired invitation');
    }
    console.log('Found valid invitation:', {
      email: invitation.email,
      role: invitation.role,
      masterAccountId: invitation.master_account_id
    });
    // 2. Create the user account using Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Auto-confirm email for invited users
    });
    if (authError) {
      console.error('Error creating auth user:', authError);
      throw new Error(`Failed to create user account: ${authError.message}`);
    }
    console.log('Auth user created successfully:', authData.user.id);
    // 3. Create user profile with the invited role
    const userProfile = {
      id: authData.user.id,
      email: email,
      role: invitation.role,
      account_type: invitation.role === 'Team Lead' ? 'master' : 'individual',
      master_account_id: invitation.role === 'Team Lead' ? null : invitation.master_account_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { data: profileData, error: profileError } = await supabase.from('users').insert([
      userProfile
    ]).select().single();
    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // If profile creation fails, clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }
    console.log('User profile created successfully:', profileData);
    // 4. Update invitation status to accepted
    const { error: updateError } = await supabase.from('team_invitations').update({
      status: 'accepted',
      accepted_at: new Date().toISOString()
    }).eq('token', token);
    if (updateError) {
      console.error('Error updating invitation status:', updateError);
    // Don't throw here as the user is already created
    }
    // 5. If Team Lead, create their master account
    if (invitation.role === 'Team Lead') {
      const { data: masterAccount, error: masterError } = await supabase.from('master_accounts').insert([
        {
          owner_id: authData.user.id,
          name: `${email.split('@')[0]}'s Team`,
          plan_type: 'starter_enterprise',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]).select().single();
      if (masterError) {
        console.error('Error creating master account:', masterError);
      // Don't throw here, just log the error
      } else {
        console.log('Master account created for Team Lead:', masterAccount);
        // Update user profile with the master account ID
        await supabase.from('users').update({
          master_account_id: masterAccount.id
        }).eq('id', authData.user.id);
      }
    }
    // 6. Generate session token for immediate login
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email
    });
    let redirectUrl;
    if (invitation.role === 'Team Lead') {
      redirectUrl = '/dashboard/master';
    } else {
      redirectUrl = '/dashboard';
    }
    return new Response(JSON.stringify({
      success: true,
      message: 'Account created successfully',
      user: profileData,
      redirectUrl: redirectUrl,
      sessionToken: sessionData?.properties?.action_link || null
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('=== ERROR IN INVITATION ACCEPTANCE ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
}
