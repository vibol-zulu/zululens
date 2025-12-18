import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const allowedOrigins = [
  'https://lovableproject.com',
  'https://lovable.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080'
];

function getCorsHeaders(origin: string | null) {
  const isAllowed = origin && (
    allowedOrigins.includes(origin) ||
    origin.endsWith('.lovableproject.com') ||
    origin.endsWith('.lovable.app')
  );
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

const SYSTEM_PROMPT = `You are an expert media analyst specializing in political media classification and audience analysis. Your task is to analyze a list of news sources/channels that a user consumes and determine their likely position on the political spectrum.

You have deep knowledge of:
- Political positioning of major and independent media outlets worldwide
- Media bias indicators and classifications from organizations like AllSides, Ad Fontes Media, Media Bias/Fact Check
- The political landscape of news media including podcasts, YouTube channels, cable news, print media, and digital outlets

Use your search capabilities to look up any channels you're not familiar with to determine their political lean.`;

const USER_PROMPT_TEMPLATE = `A user has indicated they regularly consume news from the following sources:

{channels}

Please analyze these news sources and determine:

1. **Individual Channel Analysis** - For each channel, identify:
   - The channel's political lean (Far Left, Progressive/Left, Center-Left, Center, Center-Right, Right, Far Right, Libertarian, or Non-partisan)
   - Brief reasoning for the classification

2. **Overall Political Position** - Based on the combination of sources, determine where this user likely sits on the political spectrum. Consider:
   - The weighted average of their news diet
   - Whether they consume diverse perspectives or stay in one ideological lane
   - The frequency-weight (assume equal consumption across listed sources)

3. **Position on Spectrum** - Return a numeric value from -100 to +100 where:
   - -100 = Far Left
   - -60 = Progressive/Left
   - -30 = Center-Left
   - 0 = Center
   - +30 = Center-Right
   - +60 = Right
   - +100 = Far Right

Return your analysis as JSON with this structure:
{
  "channels": [
    {
      "name": "Channel Name",
      "politicalLean": "Center-Left",
      "reasoning": "Brief explanation"
    }
  ],
  "overallPosition": {
    "label": "Center-Left",
    "numericValue": -30,
    "description": "Based on your news diet, you consume primarily center-left perspectives with some mainstream sources."
  },
  "diversityScore": "low/medium/high",
  "diversityNote": "Brief note about ideological diversity in their media consumption"
}`;

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channels }: { channels: string[] } = await req.json();
    
    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Please provide at least one channel' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!PERPLEXITY_API_KEY && !LOVABLE_API_KEY) {
      console.error('No AI API keys configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const channelList = channels.map((c, i) => `${i + 1}. ${c}`).join('\n');
    const userPrompt = USER_PROMPT_TEMPLATE.replace('{channels}', channelList);

    let response;
    let usingPerplexity = false;

    // Try Perplexity first for real-time web search
    if (PERPLEXITY_API_KEY) {
      console.log('Calling Perplexity AI to analyze political lean for channels:', channels);
      usingPerplexity = true;
      
      response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok && LOVABLE_API_KEY) {
        console.log('Perplexity failed, falling back to Lovable AI');
        usingPerplexity = false;
      }
    }

    // Fall back to Lovable AI if Perplexity not available or failed
    if (!usingPerplexity && LOVABLE_API_KEY) {
      console.log('Calling Lovable AI to analyze political lean');
      
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
        }),
      });
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : 'No response';
      console.error('AI gateway error:', response?.status, errorText);
      
      if (response?.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to analyze political lean' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON from the response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw content:', content);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse analysis',
          rawContent: content 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        citations: data.citations || [],
        service: usingPerplexity ? 'perplexity' : 'lovable-ai'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in analyze-political-lean:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
