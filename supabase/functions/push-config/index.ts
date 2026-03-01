import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate VAPID-compatible ECDSA P-256 key pair using Web Crypto
async function generateVAPIDKeys() {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );

  const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

  const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  // Private key as URL-safe base64 (d parameter from JWK)
  const privateKeyBase64 = privateKeyJwk.d!;

  return { publicKey: publicKeyBase64, privateKey: privateKeyBase64 };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Check if VAPID keys already exist
    const { data: existing } = await supabaseAdmin
      .from('sistema_config')
      .select('chave, valor')
      .in('chave', ['vapid_public_key', 'vapid_private_key']);

    const existingMap = new Map((existing || []).map(r => [r.chave, r.valor]));

    if (existingMap.has('vapid_public_key')) {
      return new Response(JSON.stringify({ publicKey: existingMap.get('vapid_public_key') }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate new keys
    const vapidKeys = await generateVAPIDKeys();

    await supabaseAdmin.from('sistema_config').insert([
      { chave: 'vapid_public_key', valor: vapidKeys.publicKey },
      { chave: 'vapid_private_key', valor: vapidKeys.privateKey },
    ]);

    return new Response(JSON.stringify({ publicKey: vapidKeys.publicKey }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
