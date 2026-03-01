import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Web Push implementation using Web Crypto API (no npm:web-push needed)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createJWT(privateKeyBase64: string, publicKeyBase64: string, audience: string): Promise<string> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 86400,
    sub: 'mailto:notificacoes@verticecmfs.com',
  };

  const encodedHeader = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Import private key
  const privateKeyBytes = urlBase64ToUint8Array(privateKeyBase64);
  const publicKeyBytes = urlBase64ToUint8Array(publicKeyBase64);

  // Create JWK for import
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: privateKeyBase64,
    x: uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33)),
    y: uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65)),
  };

  const key = await crypto.subtle.importKey(
    'jwk', jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw r||s format (if needed)
  const sigArray = new Uint8Array(signature);
  const encodedSignature = uint8ArrayToBase64Url(sigArray);

  return `${unsignedToken}.${encodedSignature}`;
}

async function encryptPayload(
  p256dhBase64: string,
  authBase64: string,
  payload: string
): Promise<{ encrypted: ArrayBuffer; salt: Uint8Array; serverPublicKey: ArrayBuffer }> {
  const p256dhKey = urlBase64ToUint8Array(p256dhBase64);
  const authSecret = urlBase64ToUint8Array(authBase64);

  // Generate ephemeral ECDH key pair
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Import client public key
  const clientPublicKey = await crypto.subtle.importKey(
    'raw', p256dhKey,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey },
    serverKeyPair.privateKey,
    256
  );

  const serverPublicKeyRaw = await crypto.subtle.exportKey('raw', serverKeyPair.publicKey);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive encryption keys using HKDF
  const authInfo = new TextEncoder().encode('Content-Encoding: auth\0');
  const prk = await hkdfExtract(authSecret, new Uint8Array(sharedSecret));

  const context = new Uint8Array([
    ...new TextEncoder().encode('P-256\0'),
    0, 65, ...p256dhKey,
    0, 65, ...new Uint8Array(serverPublicKeyRaw),
  ]);

  const cekInfo = new Uint8Array([
    ...new TextEncoder().encode('Content-Encoding: aesgcm\0'),
    ...context,
  ]);
  const nonceInfo = new Uint8Array([
    ...new TextEncoder().encode('Content-Encoding: nonce\0'),
    ...context,
  ]);

  const ikm = await hkdfExpand(prk, authInfo, 32);
  const prk2 = await hkdfExtract(salt, ikm);
  const contentEncryptionKey = await hkdfExpand(prk2, cekInfo, 16);
  const nonce = await hkdfExpand(prk2, nonceInfo, 12);

  // Encrypt with AES-GCM
  const key = await crypto.subtle.importKey(
    'raw', contentEncryptionKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const paddedPayload = new Uint8Array([0, 0, ...new TextEncoder().encode(payload)]);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    key,
    paddedPayload
  );

  return { encrypted, salt, serverPublicKey: serverPublicKeyRaw };
}

async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const result = await crypto.subtle.sign('HMAC', key, ikm);
  return new Uint8Array(result);
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const result = await crypto.subtle.sign('HMAC', key, new Uint8Array([...info, 1]));
  return new Uint8Array(result).slice(0, length);
}

async function sendWebPush(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<Response> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const jwt = await createJWT(vapidPrivateKey, vapidPublicKey, audience);
  const { encrypted, salt, serverPublicKey } = await encryptPayload(p256dh, auth, payload);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aesgcm',
      'TTL': '86400',
      'Authorization': `WebPush ${jwt}`,
      'Crypto-Key': `dh=${uint8ArrayToBase64Url(new Uint8Array(serverPublicKey))};p256ecdsa=${vapidPublicKey}`,
      'Encryption': `salt=${uint8ArrayToBase64Url(salt)}`,
    },
    body: encrypted,
  });

  return response;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { perfil_destino, usuario_destino_id, titulo, mensagem, url, tag, urgente } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get VAPID keys
    const { data: configRows } = await supabaseAdmin
      .from('sistema_config')
      .select('chave, valor')
      .in('chave', ['vapid_public_key', 'vapid_private_key']);

    const configMap = new Map((configRows || []).map(r => [r.chave, r.valor]));
    const vapidPublicKey = configMap.get('vapid_public_key');
    const vapidPrivateKey = configMap.get('vapid_private_key');

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ error: 'VAPID keys not configured. Call push-config first.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find target user IDs
    let userIds: string[] = [];
    if (usuario_destino_id) {
      userIds = [usuario_destino_id];
    } else if (perfil_destino) {
      const { data: users } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('perfil', perfil_destino)
        .eq('ativo', true);
      userIds = (users || []).map((u: any) => u.id);
    }

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check preferences and get subscriptions
    const results: any[] = [];

    for (const userId of userIds) {
      // Check if push is active for this user
      const { data: prefs } = await supabaseAdmin
        .from('preferencias_notificacao')
        .select('push_ativo')
        .eq('usuario_id', userId)
        .maybeSingle();

      // Default is push_ativo = true (if no prefs row exists)
      if (prefs && !prefs.push_ativo) continue;

      // Get active subscriptions
      const { data: subs } = await supabaseAdmin
        .from('notificacoes_push_dispositivos')
        .select('*')
        .eq('usuario_id', userId)
        .eq('ativo', true);

      for (const sub of subs || []) {
        try {
          const payload = JSON.stringify({
            title: urgente ? `⚠ ${titulo}` : titulo,
            body: mensagem,
            url: url || '/',
            tag: tag || 'vertice',
            urgente: urgente || false,
          });

          const response = await sendWebPush(
            sub.endpoint, sub.p256dh, sub.auth,
            payload, vapidPublicKey, vapidPrivateKey
          );

          if (response.status === 404 || response.status === 410) {
            // Subscription expired
            await supabaseAdmin
              .from('notificacoes_push_dispositivos')
              .update({ ativo: false })
              .eq('id', sub.id);
            results.push({ userId, status: 'expired' });
          } else if (response.ok || response.status === 201) {
            results.push({ userId, status: 'sent' });
          } else {
            results.push({ userId, status: 'failed', code: response.status });
          }
        } catch (err) {
          results.push({ userId, status: 'error', error: err.message });
        }
      }
    }

    return new Response(JSON.stringify({ sent: results.filter(r => r.status === 'sent').length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
