import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscoveredChannel {
  name: string;
  description?: string;
  category: 'corporate' | 'independent';
  content_type?: string;
  platform?: string;
  political_lean?: string;
  website_url?: string;
  parent_company?: string;
  headquarters?: string;
  founding_year?: number;
  source_url?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { country, category, searchQuery } = await req.json();

    if (!country) {
      return new Response(
        JSON.stringify({ success: false, error: 'Country is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API keys
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client to verify user and check role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Extract JWT and get user
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has required role (moderator or admin)
    const { data: hasRole } = await supabase.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'moderator' 
    });
    const { data: isAdmin } = await supabase.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });

    if (!hasRole && !isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Insufficient permissions. Moderator or Admin role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const discoveredChannels: DiscoveredChannel[] = [];
    let searchMethod = 'manual';

    // Build the search query
    const categoryFilter = category || 'all';
    const baseQuery = searchQuery || `${categoryFilter === 'corporate' ? 'major corporate' : categoryFilter === 'independent' ? 'independent alternative' : ''} news media outlets political commentators ${country}`;

    // Try Perplexity first for better structured results
    if (perplexityApiKey) {
      console.log('Using Perplexity for channel discovery');
      searchMethod = 'perplexity';
      
      try {
        const prompt = `List the top 20 ${categoryFilter === 'all' ? 'corporate and independent' : categoryFilter} news media outlets, political commentators, and news channels in ${country}. 
        
For each, provide:
- Name (exact name)
- Category (corporate or independent)
- Content type (news, commentary, investigative, etc.)
- Platform (TV, online, podcast, YouTube, etc.)
- Political lean (left, center-left, center, center-right, right)
- Website URL
- Parent company (if applicable)
- Headquarters city
- Founding year

Format as JSON array with these exact fields: name, category, content_type, platform, political_lean, website_url, parent_company, headquarters, founding_year, description`;

        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              {
                role: 'system',
                content: 'You are a research assistant that provides accurate, factual information about media organizations. Always respond with valid JSON arrays only, no markdown or explanations.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.1,
          }),
        });

        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          const content = perplexityData.choices?.[0]?.message?.content || '';
          
          // Try to parse JSON from the response
          try {
            // Extract JSON from potential markdown code blocks
            let jsonStr = content;
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
              jsonStr = jsonMatch[1];
            }
            
            const channels = JSON.parse(jsonStr.trim());
            if (Array.isArray(channels)) {
              for (const channel of channels) {
                discoveredChannels.push({
                  name: channel.name || 'Unknown',
                  description: channel.description,
                  category: channel.category === 'independent' ? 'independent' : 'corporate',
                  content_type: channel.content_type,
                  platform: channel.platform,
                  political_lean: channel.political_lean,
                  website_url: channel.website_url,
                  parent_company: channel.parent_company,
                  headquarters: channel.headquarters,
                  founding_year: channel.founding_year ? parseInt(channel.founding_year) : undefined,
                  source_url: 'perplexity-research',
                });
              }
            }
          } catch (parseError) {
            console.error('Failed to parse Perplexity response:', parseError);
          }
        }
      } catch (perplexityError) {
        console.error('Perplexity API error:', perplexityError);
      }
    }

    // Fallback to Firecrawl search if Perplexity didn't return results
    if (discoveredChannels.length === 0 && firecrawlApiKey) {
      console.log('Using Firecrawl for channel discovery');
      searchMethod = 'firecrawl';
      
      try {
        const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: baseQuery,
            limit: 20,
            scrapeOptions: {
              formats: ['markdown'],
            },
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          const results = searchData.data || [];
          
          for (const result of results) {
            // Extract channel name from title
            const title = result.title || '';
            const url = result.url || '';
            
            if (title && !title.toLowerCase().includes('list of') && !title.toLowerCase().includes('wikipedia')) {
              discoveredChannels.push({
                name: title.split(' - ')[0].split(' | ')[0].trim(),
                description: result.description || result.markdown?.substring(0, 500),
                category: categoryFilter === 'independent' ? 'independent' : 'corporate',
                website_url: url,
                source_url: url,
              });
            }
          }
        }
      } catch (firecrawlError) {
        console.error('Firecrawl API error:', firecrawlError);
      }
    }

    // If no API available, return instructions
    if (discoveredChannels.length === 0 && !perplexityApiKey && !firecrawlApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No discovery APIs configured. Please connect Perplexity or Firecrawl in your project settings.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert discovered channels into the staging table
    const insertedCount = { success: 0, skipped: 0, errors: [] as string[] };
    
    for (const channel of discoveredChannels) {
      // Check if channel already exists (by name and country)
      const { data: existing } = await supabase
        .from('channel_discoveries')
        .select('id')
        .eq('name', channel.name)
        .eq('country', country)
        .maybeSingle();

      if (existing) {
        insertedCount.skipped++;
        continue;
      }

      // Also check if it exists in user_channels
      const { data: existingApproved } = await supabase
        .from('user_channels')
        .select('id')
        .ilike('name', channel.name)
        .eq('country', country)
        .maybeSingle();

      if (existingApproved) {
        insertedCount.skipped++;
        continue;
      }

      const { error: insertError } = await supabase
        .from('channel_discoveries')
        .insert({
          name: channel.name,
          description: channel.description,
          category: channel.category,
          content_type: channel.content_type,
          platform: channel.platform,
          political_lean: channel.political_lean,
          country: country,
          website_url: channel.website_url,
          parent_company: channel.parent_company,
          headquarters: channel.headquarters,
          founding_year: channel.founding_year,
          source_url: channel.source_url,
          discovery_method: searchMethod,
          discovered_by: user.id,
          raw_data: channel,
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        insertedCount.errors.push(`${channel.name}: ${insertError.message}`);
      } else {
        insertedCount.success++;
      }
    }

    console.log(`Discovery complete: ${insertedCount.success} added, ${insertedCount.skipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        discovered: discoveredChannels.length,
        inserted: insertedCount.success,
        skipped: insertedCount.skipped,
        errors: insertedCount.errors,
        method: searchMethod,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Discovery error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Discovery failed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
