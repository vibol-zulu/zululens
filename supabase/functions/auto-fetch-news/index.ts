import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const allowedOrigins = [
  'https://bfea1556-8e0d-4436-b3d2-3bbe58acc2f1.lovableproject.com',
  'https://id-preview--bfea1556-8e0d-4436-b3d2-3bbe58acc2f1.lovable.app',
  'https://zululens.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080'
];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && allowedOrigins.some(o => origin.startsWith(o)) 
    ? origin 
    : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

const NEWS_TOPICS = [
  "media industry news journalism broadcasting",
  "political media bias coverage trends",
  "digital media streaming audience metrics social media",
  "independent media podcasts YouTube news creators",
  "media ownership consolidation journalism layoffs"
];

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Supabase credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.log('User is not admin:', user.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin authenticated:', user.email);

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

    if (!perplexityApiKey) {
      console.error('PERPLEXITY_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Perplexity API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check how many unpublished articles exist
    const { data: unpublishedNews, error: unpublishedError } = await supabaseAdmin
      .from('news_updates')
      .select('id')
      .eq('is_published', false);

    if (unpublishedError) {
      console.error('Error checking unpublished articles:', unpublishedError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to check unpublished articles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const unpublishedCount = unpublishedNews?.length || 0;
    console.log(`Found ${unpublishedCount} unpublished articles`);

    // Only fetch new articles if there are fewer than 5 unpublished
    if (unpublishedCount >= 5) {
      console.log('Skipping fetch - 5 or more unpublished articles pending review');
      return new Response(
        JSON.stringify({ 
          success: true, 
          articlesAdded: 0,
          message: `Skipped: ${unpublishedCount} unpublished articles pending review. Publish existing articles before fetching more.`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get existing article titles to avoid duplicates
    const { data: existingNews } = await supabaseAdmin
      .from('news_updates')
      .select('title')
      .order('created_at', { ascending: false })
      .limit(50);

    const existingTitles = new Set(
      (existingNews || []).map(n => n.title.toLowerCase().trim())
    );

    console.log(`Found ${existingTitles.size} existing articles to check against`);

    // Pick a random topic for variety
    const topic = NEWS_TOPICS[Math.floor(Math.random() * NEWS_TOPICS.length)];
    const searchQuery = `latest ${topic} news today ${new Date().toISOString().split('T')[0]}`;
    
    console.log(`Searching for: ${searchQuery}`);

    // Search for articles using Perplexity
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
            content: `You are a media industry news curator. Find and summarize the 5 most recent and relevant news articles about the media landscape, journalism, broadcasting, streaming, and digital media. 

For each article, provide:
1. A clear, engaging title
2. A 2-3 sentence summary of the key points
3. The source URL if available
4. A category: "industry", "political", "digital", "streaming", or "journalism"

Format your response as a JSON array with objects containing: title, summary, source_url (or null), category`
          },
          {
            role: 'user',
            content: searchQuery
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error('Perplexity API error:', perplexityResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch from Perplexity' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const perplexityData = await perplexityResponse.json();
    const content = perplexityData.choices?.[0]?.message?.content;

    console.log('Perplexity response received, parsing articles...');

    // Parse the JSON response
    let articles = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        articles = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse articles JSON:', parseError);
      // If JSON parsing fails, create a single article from the content
      articles = [{
        title: `Media Industry Update - ${new Date().toLocaleDateString()}`,
        summary: content.slice(0, 500),
        source_url: null,
        category: 'industry'
      }];
    }

    console.log(`Parsed ${articles.length} articles`);

    // Filter out duplicates and insert new articles
    const newArticles = [];
    for (const article of articles) {
      if (!article.title || existingTitles.has(article.title.toLowerCase().trim())) {
        console.log(`Skipping duplicate or invalid: ${article.title?.slice(0, 50)}`);
        continue;
      }

      const newsItem = {
        title: article.title.slice(0, 255),
        content: article.summary || article.content || '',
        category: article.category || 'industry',
        source_url: article.source_url || null,
        is_published: false, // Save as draft for admin review
        created_by: user.id, // Track which admin triggered the fetch
      };

      const { error: insertError } = await supabaseAdmin
        .from('news_updates')
        .insert(newsItem);

      if (insertError) {
        console.error('Failed to insert article:', insertError);
      } else {
        newArticles.push(article.title);
        console.log(`Inserted: ${article.title.slice(0, 50)}`);
      }
    }

    console.log(`Successfully added ${newArticles.length} new articles`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        articlesAdded: newArticles.length,
        articles: newArticles
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-fetch-news:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
