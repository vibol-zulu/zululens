import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the client's IP address from headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    
    // Try multiple IP sources
    const clientIp = cfConnectingIp || (forwardedFor?.split(',')[0].trim()) || realIp || '';
    
    console.log('Detecting country for IP:', clientIp);
    
    if (!clientIp || clientIp === '127.0.0.1' || clientIp === '::1') {
      // Local development - return default
      console.log('Local/missing IP, returning default country');
      return new Response(
        JSON.stringify({ 
          country: 'United States',
          countryCode: 'US',
          detected: false,
          message: 'Unable to detect location, using default'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use ip-api.com (free, no API key needed, 45 requests per minute)
    const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,message,country,countryCode`);
    
    if (!geoResponse.ok) {
      throw new Error(`Geolocation API error: ${geoResponse.status}`);
    }

    const geoData = await geoResponse.json();
    console.log('Geolocation response:', geoData);

    if (geoData.status === 'success' && geoData.country) {
      return new Response(
        JSON.stringify({ 
          country: geoData.country,
          countryCode: geoData.countryCode,
          detected: true,
          message: 'Country detected successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('Geolocation failed:', geoData.message);
      return new Response(
        JSON.stringify({ 
          country: 'United States',
          countryCode: 'US',
          detected: false,
          message: geoData.message || 'Geolocation lookup failed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error detecting country:', error);
    return new Response(
      JSON.stringify({ 
        country: 'United States',
        countryCode: 'US',
        detected: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 200, // Return 200 with fallback instead of error
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
