import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-id",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== RATE LIMITING =====
    const sessionId = req.headers.get('x-session-id') || 'anonymous';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit: 20 requests per 60 minutes per session
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      _identifier: sessionId,
      _action: 'questionnaire_chat',
      _max_requests: 20,
      _window_minutes: 60
    });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }

    if (allowed === false) {
      console.log('questionnaire-chat: Rate limit exceeded for session', sessionId);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. You can send up to 20 messages per hour. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // ===== END RATE LIMITING =====

    const { messages, question, explanation, category } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a helpful, neutral political discussion assistant. Your role is to help users understand and think through political questions without pushing them toward any particular viewpoint.

CURRENT QUESTION CONTEXT:
- Question: "${question}"
- Explanation: "${explanation}"
- Category: ${category}

GUIDELINES:
1. Be balanced and present multiple perspectives fairly
2. Help users understand the nuances and different viewpoints on this topic
3. Never tell users what they should believe or how they should answer
4. Provide factual context and historical background when relevant
5. Acknowledge that reasonable people can disagree on political topics
6. Keep responses concise but informative (2-3 paragraphs max)
7. If asked about your opinion, remind users you're here to help them form their own view
8. Use simple, accessible language

Your goal is to help the user think more deeply about the question so they can form their own informed opinion.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("questionnaire-chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
