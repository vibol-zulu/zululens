import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { country } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a political analyst expert. Generate exactly 8 politically relevant questions for someone in ${country || 'the United States'}.

The questions should:
1. Be relevant to current political topics and debates in that specific region
2. Cover economic, social, and governance categories
3. Be phrased as statements that someone can agree or disagree with
4. Be balanced - some should lean left when agreed with, some should lean right
5. Avoid extremely polarizing or offensive topics
6. Be neutral in tone

Return ONLY a valid JSON array with this exact structure, no other text:
[
  {
    "id": "q1",
    "text": "The statement text here",
    "explanation": "A brief 1-2 sentence explanation helping the user understand what this question is really asking about and why it matters politically.",
    "category": "economic|social|governance",
    "weight": 1 or -1
  }
]

weight: 1 means agreeing leans left, -1 means agreeing leans right.
explanation: Should clarify the political context or implications without being biased.

Make sure questions are specific to ${country || 'the United States'}'s current political landscape.`;

    console.log(`Generating questions for country: ${country}`);

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
          { role: "user", content: `Generate 8 politically relevant questions for ${country || 'the United States'}. Return only the JSON array.` }
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
      // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
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
    if (!Array.isArray(questions) || questions.length !== 8) {
      console.error("Invalid questions structure:", questions);
      throw new Error("Invalid questions format returned");
    }

    return new Response(JSON.stringify({ questions, country }), {
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
