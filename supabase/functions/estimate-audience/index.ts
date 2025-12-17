import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

interface ChannelSubmission {
  name: string;
  platform: string;
  contentType: string;
  politicalLean: string;
  category: string;
  country: string;
}

const DEFAULT_SYSTEM_PROMPT = `You are an expert media analyst specializing in audience measurement, cross-platform reach estimation, and political media classification. Your task is to:
1. Validate and cross-check user-submitted information about media channels
2. Estimate monthly audience figures based on platform, content type, and market positioning
3. Determine the political lean/bias of the channel based on your knowledge

You have deep knowledge of:
- Platform-specific audience benchmarks (YouTube, Twitter/X, TikTok, Facebook, Instagram, podcasts, cable TV, print/digital)
- Cross-platform audience overlap patterns
- Content type performance benchmarks (news, commentary, podcasts, etc.)
- Political media landscape, bias indicators, and audience segmentation
- Deduplication methodologies for cross-platform reach
- Media ownership structures and corporate vs independent classification

Use industry-standard audience measurement approaches and historical comparables to provide realistic estimates. Be critical in validating user inputs.`;

const DEFAULT_USER_PROMPT = `Analyze this media channel submission, validate the user's inputs, and estimate metrics:

**Channel Name:** {channel.name}
**Main Platform:** {channel.platform}
**Content Type:** {channel.contentType}
**Category (user selected):** {channel.category}
**Country:** {channel.country}

Based on this information, provide:

1. **Input Validation** - Cross-check the user's inputs:
   - Is the **Category** (corporate vs independent) correctly classified? Consider ownership structure, funding sources, and corporate affiliations.
   - Is the **Platform** selection accurate for this channel's primary presence?
   - Is the **Content Type** appropriate for what this channel produces?
   - Flag any discrepancies or corrections needed.

2. **Political Lean Analysis** - Based on the channel's content, hosts, editorial stance, and audience:
   - Determine the political lean from: Far Left, Progressive/Left, Center-Left, Center, Center-Right, Right, Far Right, Libertarian, Independent, Non-partisan
   - Provide brief justification for your assessment.

3. **Estimated Cross-Platform Monthly Audience (in millions)** - The total unique audience reach across major platforms.

4. **Estimated Deduplicated Monthly Audience (in millions)** - Adjusted to remove estimated audience overlap.

5. **Reasoning** (2-4 sentences) - Explain your estimation methodology.

6. **Comparable Channels** - List 2-4 similar channels used as benchmarks.

7. **Suggested Start Date** - Estimate when this channel was founded (format: MM/YYYY or "Founded YYYY").

Format your response as JSON with this structure:
{
  "inputValidation": {
    "categoryCorrect": boolean,
    "suggestedCategory": "corporate" or "independent" or null,
    "platformCorrect": boolean,
    "contentTypeCorrect": boolean,
    "validationNotes": "string explaining any issues found"
  },
  "politicalLean": "string from the options above",
  "politicalLeanJustification": "brief explanation",
  "crossPlatformAudience": number,
  "deduplicatedAudience": number,
  "reasoning": "string",
  "comparableChannels": ["channel1", "channel2"],
  "suggestedStartDate": "string"
}`;

function replaceChannelPlaceholders(template: string, channel: ChannelSubmission): string {
  return template
    .replace(/\{channel\.name\}/g, channel.name)
    .replace(/\{channel\.platform\}/g, channel.platform)
    .replace(/\{channel\.contentType\}/g, channel.contentType)
    .replace(/\{channel\.politicalLean\}/g, channel.politicalLean || 'Not specified')
    .replace(/\{channel\.category\}/g, channel.category)
    .replace(/\{channel\.country\}/g, channel.country);
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channel }: { channel: ChannelSubmission } = await req.json();
    
    if (!channel || !channel.name || !channel.platform || !channel.contentType) {
      return new Response(
        JSON.stringify({ error: 'Missing required channel fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch custom prompts from app_settings
    let systemPrompt = DEFAULT_SYSTEM_PROMPT;
    let userPromptTemplate = DEFAULT_USER_PROMPT;

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: settings } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['audience_system_prompt', 'audience_user_prompt']);

      if (settings) {
        for (const setting of settings) {
          if (setting.key === 'audience_system_prompt' && setting.value?.trim()) {
            systemPrompt = setting.value;
            console.log('Using custom system prompt from settings');
          }
          if (setting.key === 'audience_user_prompt' && setting.value?.trim()) {
            userPromptTemplate = setting.value;
            console.log('Using custom user prompt from settings');
          }
        }
      }
    } catch (settingsError) {
      console.log('Could not fetch custom prompts, using defaults:', settingsError);
    }

    // Replace placeholders in user prompt
    const userPrompt = replaceChannelPlaceholders(userPromptTemplate, channel);

    console.log('Calling Lovable AI for channel:', channel.name);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI service unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response - handle markdown code blocks
    let parsedContent;
    try {
      // Remove markdown code blocks if present
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      parsedContent = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI response',
          rawContent: content 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully estimated audience for:', channel.name);

    return new Response(
      JSON.stringify({
        success: true,
        estimate: {
          inputValidation: parsedContent.inputValidation || null,
          politicalLean: parsedContent.politicalLean || null,
          politicalLeanJustification: parsedContent.politicalLeanJustification || null,
          crossPlatformAudience: parsedContent.crossPlatformAudience,
          deduplicatedAudience: parsedContent.deduplicatedAudience,
          reasoning: parsedContent.reasoning,
          comparableChannels: parsedContent.comparableChannels,
          suggestedStartDate: parsedContent.suggestedStartDate
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Estimate audience error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
