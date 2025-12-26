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

const DEFAULT_SYSTEM_PROMPT = `You are an expert media analyst specializing in audience measurement, cross-platform reach estimation, and political media classification. Use real-time web search to research the channel and provide accurate, current information.

Your task is to:
1. SEARCH for current information about this media channel - look up their actual subscriber counts, viewership data, and social media presence
2. Validate and cross-check user-submitted information against real data
3. Estimate monthly audience figures based on actual platform metrics you find
4. Determine the political lean/bias based on verified content analysis and third-party assessments

KEY DATA SOURCES TO USE:
- **SocialBlade.com** - Use this for YouTube subscriber counts, estimated monthly views, growth trends, and historical data
- **VidIQ.com** - Use this for YouTube analytics, view counts, engagement metrics, and audience insights
- **Similar Web** - For website traffic and audience demographics
- **Podcast charts** (Apple Podcasts, Spotify) - For podcast download/listener estimates
- **Media bias organizations** (AllSides, Ad Fontes Media, Media Bias/Fact Check) - For political lean assessments

You have deep knowledge of:
- Platform-specific audience benchmarks (YouTube, Twitter/X, TikTok, Facebook, Instagram, podcasts, cable TV, print/digital)
- Cross-platform audience overlap patterns and deduplication methodologies
- Political media landscape, bias indicators, and audience segmentation
- Media ownership structures and corporate vs independent classification

IMPORTANT: Use your search capabilities to find REAL, CURRENT data about this channel. Prioritize SocialBlade and VidIQ for YouTube channels. Include citations where possible.`;

const DEFAULT_USER_PROMPT = `Research and analyze this media channel submission using real-time web search:

**Channel Name:** {channel.name}
**Main Platform:** {channel.platform}
**Content Type:** {channel.contentType}
**Category (user selected):** {channel.category}
**Country:** {channel.country}

SEARCH for current information about "{channel.name}" using these specific sources:
- **SocialBlade.com** - Search for "{channel.name} socialblade" to get subscriber counts, monthly views, and growth data
- **VidIQ.com** - Search for "{channel.name} vidiq" for engagement metrics and audience analytics
- Cross-reference with the channel's official social media pages for follower counts
- Look up ownership structure (corporate parent or independent)
- Check media bias organizations for political lean assessments

Based on your research, provide:

1. **Input Validation** - Cross-check the user's inputs against what you found:
   - Is the **Category** (corporate vs independent) correctly classified? Research ownership structure.
   - Is the **Platform** selection accurate for this channel's primary presence?
   - Is the **Content Type** appropriate for what this channel produces?
   - Flag any discrepancies or corrections needed.

2. **Political Lean Analysis** - Based on your research of the channel's content, hosts, and third-party assessments:
   - Determine the political lean from: Far Left, Progressive/Left, Center-Left, Center, Center-Right, Right, Far Right, Libertarian, Independent, Non-partisan
   - Cite sources for your assessment where possible.

3. **Estimated Cross-Platform Monthly Audience (in millions)** - Based on actual subscriber/follower data from SocialBlade, VidIQ, and other sources.

4. **Estimated Deduplicated Unique Monthly Audience "UMA" (in millions)** - This is the KEY metric that determines the circle radius in the visualization. Calculate by:
   - Starting with cross-platform reach
   - Applying 20-40% deduplication for audience overlap across platforms
   - For YouTube: Use monthly views / 4-8 (depending on content frequency) as a proxy for unique monthly viewers
   - Cite your methodology and data sources

5. **Reasoning** (2-4 sentences) - Cite the specific data sources you found (SocialBlade stats, VidIQ metrics, etc.).

6. **Comparable Channels** - List 2-4 similar channels with similar audience size for context.

7. **Suggested Start Date** - When this channel was founded based on your research.

Format your response as JSON with this structure:
{
  "inputValidation": {
    "categoryCorrect": boolean,
    "suggestedCategory": "corporate" or "independent" or null,
    "platformCorrect": boolean,
    "contentTypeCorrect": boolean,
    "validationNotes": "string explaining any issues found with citations"
  },
  "politicalLean": "string from the options above",
  "politicalLeanJustification": "brief explanation with sources",
  "crossPlatformAudience": number,
  "deduplicatedAudience": number,
  "reasoning": "string with data sources including SocialBlade/VidIQ citations",
  "comparableChannels": ["channel1", "channel2"],
  "suggestedStartDate": "string"
}`;

const DEFAULT_CORPORATE_USER_PROMPT = `You are assisting researchers in estimating a corporate media conglomerate's deduplicated Unique Monthly Audience (UMA) using a top-level brand approach.

**Corporate Conglomerate Name:** {channel.name}
**Main Platform:** {channel.platform}
**Content Type:** {channel.contentType}
**Category (user selected):** {channel.category}
**Primary Geography / Market Focus:** {channel.country}

The goal is to work at the level of:
- Primary TV / cable / streaming news brands (e.g. Fox News Channel, CNN, MSNBC, ABC News, NBC News).
- Major digital and streaming properties directly associated with those brands (e.g. foxnews.com, cnn.com, NBCNews.com, YouTube channels, news apps, podcast networks).

Do not attempt an exhaustive sub-brand breakdown. Focus on the main audience-driving brands and their major digital extensions.

**Step 1: Identify main news/information brands and key digital properties**

List the conglomerate's top-level news and public-affairs brands and their largest related digital properties, for example:
- Linear / cable / broadcast news networks (e.g. Fox News Channel, CNN, MSNBC, ABC News, CBS News, NBC News).
- Flagship news websites (e.g. foxnews.com, cnn.com, nytimes.com for relevant owners).
- Major streaming news brands or tiles (e.g. CNN on Max, NBC News on Peacock, etc., if significant).
- Major digital video / social presences directly tied to these brands (e.g. "Fox News" YouTube, "CNN" YouTube, "MSNBC" YouTube).

For each top-level brand, provide:
- Brand name.
- Type: cable news, broadcast news, digital news site, streaming news, or multi-platform news brand.
- Main platforms that matter for audience (TV, website, app, YouTube, other social).

**Step 2: Estimate cross-platform monthly audience per top-level brand**

For each brand (including its major digital properties), estimate a cross-platform monthly audience (unique people per month) in millions. Treat the TV channel and its tightly associated digital properties as one brand cluster for this step.

For each brand cluster, provide:
- A point estimate in millions of unique people reached per month.
- A short explanation referencing typical scale of similar US or global news brands (e.g. "major US cable news network," "large national news site," "smaller but influential cable channel").

Example format (illustrative only):
- Fox News (linear + foxnews.com + main Fox News YouTube/social): 90–110M monthly uniques; working estimate 100M.
- Fox Business (TV + digital): 20–30M; working estimate 25M.

**Step 3: Apply deduplication across brand clusters**

Work at the brand cluster level (e.g. Fox News vs Fox Business vs broadcast network news for the same conglomerate). Estimate overlap between audiences and apply deduplication factors.

For each additional brand after the largest one, estimate the incremental audience that is not already counted:
- Define whether overlap with the largest brand is high, moderate, or low.
  - High overlap: heavily overlapping news audiences within same ideological lane and owner (e.g. Fox News vs Fox Business; CNN linear vs CNN digital).
  - Moderate overlap: related but somewhat distinct audiences (e.g. broadcast evening news vs cable news; news site vs more lifestyle/soft news property).
  - Low overlap: brands in different genres or strongly different demographics (e.g. children's or general entertainment vs hard news).
- Translate this into an overlap rate, such as:
  - 60–70% overlap for high.
  - 40–60% overlap for moderate.
  - 10–30% overlap for low.

Use this relationship to compute incremental audience added by each brand:
- Incremental audience ≈ Brand cluster audience × (1 − overlap_rate).

Clearly state the overlap rate and reasoning for each brand cluster relative to the already-counted ones.

**Step 4: Compute conglomerate-level UMA**

1. Choose the largest news/information brand cluster as the anchor and take its cross-platform monthly audience as the starting point.
2. Add each remaining brand cluster's incremental audience (after deduplication) to build up a conglomerate-level UMA.
3. Provide:
   - A stepwise description showing the anchor brand, each added brand, its overlap rate, incremental audience, and running total.
   - A final UMA point estimate in millions of unique people per month, plus a plausible low–high range.

**Step 5: Input Validation**

Cross-check the user's inputs:
- Is the **Category** (corporate vs independent) correctly classified? Research ownership structure.
- Is the **Platform** selection accurate for this conglomerate's primary presence?
- Is the **Content Type** appropriate for what this conglomerate produces?
- Flag any discrepancies or corrections needed.

**Step 6: Political Lean Analysis**

Based on your research of the conglomerate's content, editorial stance, and third-party assessments:
- Determine the political lean from: Far Left, Progressive/Left, Center-Left, Center, Center-Right, Right, Far Right, Libertarian, Independent, Non-partisan
- Cite sources for your assessment where possible.

**Output Format**

Return your answer as JSON with this structure:
{
  "inputValidation": {
    "categoryCorrect": boolean,
    "suggestedCategory": "corporate" or "independent" or null,
    "platformCorrect": boolean,
    "contentTypeCorrect": boolean,
    "validationNotes": "string explaining any issues found with citations"
  },
  "politicalLean": "string from the options above",
  "politicalLeanJustification": "brief explanation with sources",
  "brandClusters": [
    {
      "name": "Brand Name",
      "type": "cable news / broadcast news / digital news site / streaming news / multi-platform",
      "platforms": ["TV", "website", "YouTube", "etc"],
      "estimatedAudience": number,
      "reasoning": "brief explanation"
    }
  ],
  "deduplicationSteps": [
    {
      "brand": "Brand Name",
      "overlapWithAnchor": "high / moderate / low",
      "overlapRate": number,
      "incrementalAudience": number,
      "runningTotal": number
    }
  ],
  "crossPlatformAudience": number,
  "deduplicatedAudience": number,
  "audienceRange": {
    "low": number,
    "high": number
  },
  "reasoning": "Summary of methodology and key data sources used",
  "comparableChannels": ["conglomerate1", "conglomerate2"],
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
    // ===== AUTHENTICATION & AUTHORIZATION =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('estimate-audience: No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      console.log('estimate-audience: Invalid JWT or user not found', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for admin or moderator role
    const { data: isModerator } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'moderator'
    });
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isModerator && !isAdmin) {
      console.log('estimate-audience: User lacks required role', user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin or Moderator role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('estimate-audience: Authorized user', user.id, 'role:', isAdmin ? 'admin' : 'moderator');
    // ===== END AUTHENTICATION & AUTHORIZATION =====

    const { channel }: { channel: ChannelSubmission } = await req.json();
    
    if (!channel || !channel.name || !channel.platform || !channel.contentType) {
      return new Response(
        JSON.stringify({ error: 'Missing required channel fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try Perplexity first, fall back to Lovable AI
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!PERPLEXITY_API_KEY && !LOVABLE_API_KEY) {
      console.error('No AI API keys configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch custom prompts from app_settings
    let systemPrompt = DEFAULT_SYSTEM_PROMPT;
    let userPromptTemplate = DEFAULT_USER_PROMPT;
    let corporateUserPromptTemplate = DEFAULT_CORPORATE_USER_PROMPT;

    try {
      const { data: settings } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['audience_system_prompt', 'audience_user_prompt', 'audience_corporate_user_prompt']);

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
          if (setting.key === 'audience_corporate_user_prompt' && setting.value?.trim()) {
            corporateUserPromptTemplate = setting.value;
            console.log('Using custom corporate user prompt from settings');
          }
        }
      }
    } catch (settingsError) {
      console.log('Could not fetch custom prompts, using defaults:', settingsError);
    }

    // Select the appropriate user prompt based on channel category
    const isCorporate = channel.category?.toLowerCase() === 'corporate';
    const selectedUserPromptTemplate = isCorporate ? corporateUserPromptTemplate : userPromptTemplate;
    console.log(`Using ${isCorporate ? 'corporate' : 'independent'} user prompt template`);

    // Replace placeholders in user prompt
    const userPrompt = replaceChannelPlaceholders(selectedUserPromptTemplate, channel);

    let response;
    let usingPerplexity = false;

    // Try Perplexity first for real-time web search
    if (PERPLEXITY_API_KEY) {
      console.log('Calling Perplexity AI for channel:', channel.name);
      usingPerplexity = true;
      
      response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-pro', // Multi-step reasoning with 2x more citations
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          search_recency_filter: 'month', // Focus on recent data
        }),
      });

      // If Perplexity fails, fall back to Lovable AI
      if (!response.ok && LOVABLE_API_KEY) {
        console.log('Perplexity failed, falling back to Lovable AI');
        usingPerplexity = false;
      }
    }

    // Fall back to Lovable AI if Perplexity not available or failed
    if (!usingPerplexity && LOVABLE_API_KEY) {
      console.log('Calling Lovable AI for channel:', channel.name);
      
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
      if (response?.status === 402) {
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
    const citations = data.citations || []; // Perplexity provides citations

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

    console.log('Successfully estimated audience for:', channel.name, usingPerplexity ? '(via Perplexity)' : '(via Lovable AI)');

    return new Response(
      JSON.stringify({
        success: true,
        source: usingPerplexity ? 'perplexity' : 'lovable-ai',
        citations: citations,
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
