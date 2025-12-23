import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Governance domains with pyramid weighting (more questions for macro-level)
const GOVERNANCE_DOMAINS = [
  { id: 'personal', name: 'Personal & Home', weight: 0.10, questionCount: 1 },
  { id: 'social', name: 'Social Circles', weight: 0.10, questionCount: 1 },
  { id: 'professional', name: 'Professional', weight: 0.15, questionCount: 1 },
  { id: 'local', name: 'Local & Civic', weight: 0.15, questionCount: 2 },
  { id: 'national', name: 'National', weight: 0.25, questionCount: 2 },
  { id: 'international', name: 'International', weight: 0.25, questionCount: 3 },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { country } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Try to fetch custom prompt from settings
    let customPrompt: string | null = null;
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'questionnaire_prompt')
          .maybeSingle();
        
        if (data?.value) {
          customPrompt = data.value;
          console.log("Using custom questionnaire prompt from settings");
        }
      } catch (e) {
        console.log("Could not fetch custom prompt, using default:", e);
      }
    }

    // Generate a random seed to encourage question variety
    const randomSeed = Math.random().toString(36).substring(2, 10);

    // Use custom prompt if available, otherwise use default multi-domain prompt
    let systemPrompt: string;
    
    if (customPrompt) {
      systemPrompt = customPrompt
        .replace(/\{country\}/g, country || 'the United States')
        + `\n\nRandom seed for variety: ${randomSeed}`;
    } else {
      systemPrompt = `You are a political philosophy analyst. Generate exactly 10 questions across 6 governance domains to assess someone's political ideology at different scales of governance in ${country || 'the United States'}.

GOVERNANCE DOMAINS (generate the specified number of questions for each):

1. PERSONAL & HOME (1 question) - Self-governance, family decision-making, parenting philosophy
   
2. SOCIAL CIRCLES (1 question) - Peer groups, friendships, community involvement
   
3. PROFESSIONAL (1 question) - Workplace governance, labor relations, hierarchy preferences
   
4. LOCAL & CIVIC (2 questions) - Neighborhood rules, local government, municipal services
   
5. NATIONAL (2 questions) - Federal policy, constitutional interpretation, domestic policy
   
6. INTERNATIONAL (3 questions) - Foreign policy, sovereignty, global institutions

Random seed for variety: ${randomSeed}

CRITICAL GUIDELINES:
- The "text" field must be VERY CONCISE: maximum 10 words. Short, punchy statements only.
- The "explanation" object must be DETAILED and COMPREHENSIVE for users who want to understand deeply.
- Questions should reveal governance philosophy (authoritarian vs libertarian, collectivist vs individualist)
- Be balanced: some statements should lean left when agreed, others right when agreed
- Make questions specific and nuanced, not generic
- Questions should work for ${country || 'the United States'}'s cultural context

CRITICAL FORMAT - Return ONLY valid JSON array:
[
  {
    "id": "q1",
    "text": "Very short statement (max 10 words)",
    "domain": "personal|social|professional|local|national|international",
    "domainName": "Personal & Home|Social Circles|Professional|Local & Civic|National|International",
    "explanation": {
      "summary": "A 2-3 sentence overview explaining what this question explores and why it matters for understanding political philosophy.",
      "agreement": "Detailed explanation (3-4 sentences) of what agreeing with this statement indicates about someone's governance philosophy, values, and worldview.",
      "disagreement": "Detailed explanation (3-4 sentences) of what disagreeing with this statement indicates about someone's governance philosophy, values, and worldview."
    },
    "category": "economic|social|governance",
    "weight": 1 or -1
  }
]

DISTRIBUTION:
- q1: personal domain (1)
- q2: social domain (1)  
- q3: professional domain (1)
- q4-q5: local domain (2)
- q6-q7: national domain (2)
- q8-q10: international domain (3)

weight: 1 means agreeing leans left/progressive, -1 means agreeing leans right/conservative`;
    }

    console.log(`Generating multi-domain questions for country: ${country}`);

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
          { role: "user", content: `Generate 10 multi-domain political philosophy questions for ${country || 'the United States'}. Remember: question text must be very short (max 10 words), but explanations should be detailed. Return only the JSON array.` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response content:", content);

    // Parse the JSON from the response
    let questions;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse generated questions");
    }

    // Validate the structure
    if (!Array.isArray(questions) || questions.length !== 10) {
      console.error("Invalid questions structure, expected 10, got:", questions?.length);
      throw new Error("Invalid questions format returned");
    }

    // Ensure domain info is present on all questions
    const domainsInfo = GOVERNANCE_DOMAINS.map(d => ({ id: d.id, name: d.name, weight: d.weight }));

    return new Response(JSON.stringify({ 
      questions, 
      country,
      domains: domainsInfo
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating questions:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      fallback: true 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
