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
    const apiKey = Deno.env.get('OPENEXCHANGE_API_KEY');
    
    if (!apiKey) {
      console.error('OPENEXCHANGE_API_KEY is not set');
      throw new Error('API key not configured');
    }

    console.log('Fetching exchange rates from OpenExchangeRates...');
    
    const response = await fetch(
      `https://openexchangerates.org/api/latest.json?app_id=${apiKey}&symbols=TRY,USD`
    );

    if (!response.ok) {
      console.error('OpenExchangeRates API error:', response.status, response.statusText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Exchange rate data received:', data);

    // OpenExchangeRates returns rates relative to USD
    // So TRY rate is already USD -> TRY
    const usdToTry = data.rates.TRY;
    const tryToUsd = 1 / usdToTry;

    return new Response(
      JSON.stringify({
        usdToTry,
        tryToUsd,
        timestamp: data.timestamp,
        lastUpdate: new Date(data.timestamp * 1000).toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in get-exchange-rate function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
