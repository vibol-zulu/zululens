import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const allowedOrigins = [
  'https://rrkafsajterndartjuvg.lovableproject.com',
  'https://preview--rrkafsajterndartjuvg.lovable.app',
  'https://rrkafsajterndartjuvg.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))
    ? origin
    : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface AIAnalysisData {
  estimatedAudience?: number;
  politicalLean?: string;
  category?: string;
  comparableChannels?: string[];
}

interface SubmissionEmailRequest {
  userId: string;
  channelName: string;
  status: 'approved' | 'rejected';
  country: string;
  aiAnalysis?: AIAnalysisData;
}

function buildAIAnalysisSection(aiAnalysis: AIAnalysisData | undefined, isApproved: boolean): string {
  if (!aiAnalysis) return '';
  
  const items: string[] = [];
  
  if (aiAnalysis.estimatedAudience !== undefined) {
    items.push(`<li><strong>Estimated Monthly Audience:</strong> ${aiAnalysis.estimatedAudience.toFixed(2)}M</li>`);
  }
  
  if (aiAnalysis.politicalLean) {
    items.push(`<li><strong>Political Lean:</strong> ${escapeHtml(aiAnalysis.politicalLean)}</li>`);
  }
  
  if (aiAnalysis.category) {
    items.push(`<li><strong>Category:</strong> ${escapeHtml(aiAnalysis.category)}</li>`);
  }
  
  if (aiAnalysis.comparableChannels && aiAnalysis.comparableChannels.length > 0) {
    const channels = aiAnalysis.comparableChannels.slice(0, 3).map(c => escapeHtml(c)).join(', ');
    items.push(`<li><strong>Comparable Channels:</strong> ${channels}</li>`);
  }
  
  if (items.length === 0) return '';
  
  const bgColor = isApproved ? '#E3F2FD' : '#FFF8E1';
  const borderColor = isApproved ? '#2196F3' : '#FFC107';
  const headerColor = isApproved ? '#1565C0' : '#F57F17';
  
  return `
    <div style="background-color: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; color: ${headerColor}; font-weight: bold; font-size: 14px;">
        📊 AI Analysis Results
      </p>
      <ul style="margin: 0; padding-left: 20px; color: #333; font-size: 14px; line-height: 1.8;">
        ${items.join('')}
      </ul>
    </div>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('send-submission-email function invoked');
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body));
    
    const { userId, channelName, status, country, aiAnalysis }: SubmissionEmailRequest = body;

    // Validate inputs
    if (!userId || !channelName || !status) {
      console.error('Missing required fields:', { userId, channelName, status });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Create Supabase client to fetch user email
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user's email from profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.email) {
      console.error('Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ error: "Could not find user email" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userName = profile.full_name || 'Contributor';
    const safeName = escapeHtml(userName);
    const safeChannelName = escapeHtml(channelName);
    const safeCountry = escapeHtml(country || 'your selected country');

    const isApproved = status === 'approved';
    const subject = isApproved 
      ? `🎉 Your Channel Submission Has Been Approved!`
      : `Update on Your Channel Submission`;

    const aiAnalysisHtml = buildAIAnalysisSection(aiAnalysis, isApproved);

    const htmlContent = isApproved
      ? `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #00564A; margin-bottom: 20px;">Great News, ${safeName}!</h1>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Your channel submission <strong>"${safeChannelName}"</strong> for ${safeCountry} has been approved and is now live in the Media Landscape visualization!
          </p>
          
          ${aiAnalysisHtml}
          
          <div style="background-color: #E8F5E9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #2E7D32; font-size: 14px;">
              ✓ Your contribution helps build a more comprehensive picture of the media landscape.
            </p>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Keep contributing! Each approved submission brings you closer to becoming a Contributor.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            If you believe this decision was made in error, you can reply to this email to dispute it.
          </p>
          
          <p style="color: #888; font-size: 12px; margin-top: 30px;">
            — The Zulu Digital Microscope Team
          </p>
        </div>
      `
      : `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #00564A; margin-bottom: 20px;">Hi ${safeName},</h1>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Thank you for your channel submission <strong>"${safeChannelName}"</strong> for ${safeCountry}.
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            After careful review, we were unable to approve this submission at this time. This could be due to:
          </p>
          
          <ul style="color: #555; font-size: 14px; line-height: 1.8;">
            <li>The channel may already exist in our database</li>
            <li>Insufficient information to verify the channel's audience metrics</li>
            <li>The channel category may not align with our current focus</li>
            <li>The submission may not meet our editorial guidelines</li>
          </ul>
          
          ${aiAnalysisHtml}
          
          <div style="background-color: #FFF3E0; border-left: 4px solid #FF9800; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #E65100; font-size: 14px;">
              <strong>Want to dispute this decision?</strong><br />
              Simply reply to this email with additional information about the channel, and our team will review your submission again.
            </p>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            We encourage you to review our submission guidelines and try again with a different channel or additional supporting information.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="color: #888; font-size: 12px; margin-top: 30px;">
            — The Zulu Digital Microscope Team
          </p>
        </div>
      `;

    console.log(`Sending ${status} email to ${profile.email} for channel "${channelName}"`, aiAnalysis ? 'with AI analysis' : '');

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Zulu Digital Microscope <vibol@zulu.group>",
        to: [profile.email],
        subject: subject,
        html: htmlContent,
        reply_to: "vibol@zulu.group"
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-submission-email function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
