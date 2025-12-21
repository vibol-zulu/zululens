import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChannelInfo {
  id: string;
  name: string;
  category: string;
  platform: string;
  content_type: string;
  political_lean: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { channelId, populateAll } = await req.json();

    console.log('Populate channel profile request:', { channelId, populateAll });

    let channelsToPopulate: ChannelInfo[] = [];

    if (populateAll) {
      // Fetch all approved channels with empty profiles
      const { data: emptyProfiles, error: fetchError } = await supabase
        .from('channel_profiles')
        .select(`
          channel_id,
          description,
          website_url,
          user_channels!inner(id, name, category, platform, content_type, political_lean, status)
        `)
        .is('description', null)
        .eq('user_channels.status', 'approved');

      if (fetchError) {
        console.error('Error fetching empty profiles:', fetchError);
        throw fetchError;
      }

      channelsToPopulate = (emptyProfiles || []).map((p: any) => ({
        id: p.channel_id,
        name: p.user_channels.name,
        category: p.user_channels.category,
        platform: p.user_channels.platform,
        content_type: p.user_channels.content_type,
        political_lean: p.user_channels.political_lean,
      }));

      console.log(`Found ${channelsToPopulate.length} channels to populate`);
    } else if (channelId) {
      // Fetch single channel
      const { data: channel, error: channelError } = await supabase
        .from('user_channels')
        .select('id, name, category, platform, content_type, political_lean')
        .eq('id', channelId)
        .single();

      if (channelError) throw channelError;
      channelsToPopulate = [channel];
    }

    if (channelsToPopulate.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No channels to populate', populated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let populated = 0;
    const errors: string[] = [];

    for (const channel of channelsToPopulate) {
      try {
        console.log(`Populating profile for: ${channel.name}`);

        let profileData: {
          description: string;
          website_url: string | null;
          parent_company: string | null;
          headquarters: string | null;
          founding_year: number | null;
        };

        if (perplexityApiKey) {
          // Use Perplexity API for research
          const prompt = `Provide factual information about the media channel/outlet "${channel.name}". 
This is a ${channel.category} ${channel.content_type} on ${channel.platform} with a ${channel.political_lean} political lean.

Return a JSON object with these fields:
- description: A 2-3 sentence factual description of this media outlet (what it is, what it covers, who runs it)
- website_url: The official website URL (or null if unknown)
- parent_company: The parent company or owner (or null if independent/unknown)
- headquarters: City and state/country of headquarters (or null if unknown)
- founding_year: Year founded as a number (or null if unknown)

Return ONLY valid JSON, no markdown or explanation.`;

          const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${perplexityApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama-3.1-sonar-small-128k-online',
              messages: [
                { role: 'system', content: 'You are a media research assistant. Return only valid JSON.' },
                { role: 'user', content: prompt }
              ],
              max_tokens: 500,
            }),
          });

          if (!response.ok) {
            throw new Error(`Perplexity API error: ${response.status}`);
          }

          const result = await response.json();
          const content = result.choices[0]?.message?.content || '';
          
          // Parse JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            profileData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Could not parse JSON from AI response');
          }
        } else {
          // Fallback: generate basic profile without AI
          profileData = {
            description: `${channel.name} is a ${channel.category} media outlet focused on ${channel.content_type} content.`,
            website_url: null,
            parent_company: channel.category === 'corporate' ? 'Major media conglomerate' : null,
            headquarters: null,
            founding_year: null,
          };
        }

        // Update the channel profile
        const { error: updateError } = await supabase
          .from('channel_profiles')
          .update({
            description: profileData.description,
            website_url: profileData.website_url,
            parent_company: profileData.parent_company,
            headquarters: profileData.headquarters,
            founding_year: profileData.founding_year,
            updated_at: new Date().toISOString(),
          })
          .eq('channel_id', channel.id);

        if (updateError) {
          console.error(`Error updating profile for ${channel.name}:`, updateError);
          errors.push(`${channel.name}: ${updateError.message}`);
        } else {
          console.log(`Successfully populated profile for: ${channel.name}`);
          populated++;
        }

        // Add a small delay to avoid rate limiting
        if (channelsToPopulate.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (channelError) {
        const errorMsg = channelError instanceof Error ? channelError.message : String(channelError);
        console.error(`Error processing ${channel.name}:`, channelError);
        errors.push(`${channel.name}: ${errorMsg}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Populated ${populated} of ${channelsToPopulate.length} profiles`,
        populated,
        total: channelsToPopulate.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error in populate-channel-profile:', error);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});