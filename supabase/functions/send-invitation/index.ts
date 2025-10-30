import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

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

const serve_handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, role, token, inviterName }: InvitationRequest = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the current domain for the invitation link
    const invitationUrl = `${req.headers.get('origin') || 'https://bcuhyyyerxwgkrkbrqbs.supabase.co'}/accept-invitation?token=${token}`;

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

    // For now, we'll return success - in production you'd integrate with an email service
    // like Resend, SendGrid, or similar
    console.log('Invitation would be sent to:', email);
    console.log('Role:', role);
    console.log('Invitation URL:', invitationUrl);
    
    // TODO: Integrate with email service
    // Example with Resend:
    /*
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const emailResponse = await resend.emails.send({
      from: "Team@yourcompany.com",
      to: [email],
      subject: `You're invited to join our team as ${role}`,
      html: `
        <h2>Team Invitation</h2>
        <p>You've been invited by ${inviterName || 'a team member'} to join as ${role}.</p>
        <p><a href="${invitationUrl}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Accept Invitation</a></p>
        <p>Or copy and paste this link: ${invitationUrl}</p>
        <p>This invitation expires in 7 days.</p>
      `,
    });
    */

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
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(serve_handler);
