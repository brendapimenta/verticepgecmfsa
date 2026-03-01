import { supabase } from '@/integrations/supabase/client';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

let vapidPublicKeyCache: string | null = null;

async function getVapidPublicKey(): Promise<string | null> {
  if (vapidPublicKeyCache) return vapidPublicKeyCache;
  try {
    const { data, error } = await supabase.functions.invoke('push-config');
    if (error || !data?.publicKey) return null;
    vapidPublicKeyCache = data.publicKey;
    return data.publicKey;
  } catch {
    return null;
  }
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getPushPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (err) {
    console.error('SW registration failed:', err);
    return null;
  }
}

export async function subscribeToPush(usuarioId: string): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const registration = await registerServiceWorker();
    if (!registration) return false;

    // Wait for service worker to be ready
    const readyReg = await navigator.serviceWorker.ready;

    const publicKey = await getVapidPublicKey();
    if (!publicKey) {
      console.error('Could not get VAPID public key');
      return false;
    }

    const pm = (readyReg as any).pushManager;
    if (!pm) return false;

    // Check if already subscribed
    const existingSub = await pm.getSubscription();
    if (existingSub) {
      await saveSubscription(usuarioId, existingSub);
      return true;
    }

    // Subscribe
    const subscription = await pm.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await saveSubscription(usuarioId, subscription);
    return true;
  } catch (err) {
    console.error('Push subscription failed:', err);
    return false;
  }
}

async function saveSubscription(usuarioId: string, subscription: PushSubscription): Promise<void> {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

  const ua = navigator.userAgent;
  let navegador = 'Desconhecido';
  if (ua.includes('Chrome')) navegador = 'Chrome';
  else if (ua.includes('Firefox')) navegador = 'Firefox';
  else if (ua.includes('Safari')) navegador = 'Safari';
  else if (ua.includes('Edge')) navegador = 'Edge';

  const dispositivo = /Mobile|Android|iPhone|iPad/.test(ua) ? 'Mobile' : 'Desktop';

  await supabase.from('notificacoes_push_dispositivos').upsert({
    usuario_id: usuarioId,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    navegador,
    dispositivo,
    ativo: true,
  }, { onConflict: 'usuario_id,endpoint' } as any);
}

export async function unsubscribeFromPush(usuarioId: string): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const pm = (registration as any).pushManager;
      const subscription = pm ? await pm.getSubscription() : null;
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        // Mark as inactive in DB
        await supabase
          .from('notificacoes_push_dispositivos')
          .update({ ativo: false } as any)
          .eq('usuario_id', usuarioId)
          .eq('endpoint', endpoint);
      }
    }
  } catch (err) {
    console.error('Unsubscribe failed:', err);
  }
}

// Show a browser notification directly (when the page is active)
export function showBrowserNotification(title: string, body: string, url?: string): void {
  if (Notification.permission !== 'granted') return;
  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'vertice-inline',
    });
    if (url) {
      notification.onclick = () => {
        window.focus();
        window.location.href = url;
        notification.close();
      };
    }
  } catch {
    // Fallback: try via service worker
    navigator.serviceWorker?.ready.then(reg => {
      reg.showNotification(title, { body, icon: '/favicon.ico', data: { url } });
    }).catch(() => {});
  }
}
