/**
 * Browser & Mobile Web Notifications Utility
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Play a subtle, pleasant chime using Web Audio API
 */
export function playNotificationTone() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Two pleasant ascending sine waves (E5 -> A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc1.frequency.setValueAtTime(880.00, now + 0.1); // A5

    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);
  } catch (e) {
    // Audio autoplay restrictions or unsupported
  }
}

/**
 * Trigger mobile vibration if supported
 */
export function triggerVibration(pattern: number[] = [150, 75, 150]) {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    // Vibration not allowed
  }
}

/**
 * Show a local device / mobile push notification
 */
export function showDeviceNotification(title: string, options?: NotificationOptions) {
  playNotificationTone();
  triggerVibration();

  if (!isNotificationSupported()) return;

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310b981'><circle cx='12' cy='12' r='10'/></svg>",
        badge: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310b981'><circle cx='12' cy='12' r='10'/></svg>",
        ...options,
      });
    } catch (err) {
      console.warn('Notification constructor error (possibly mobile Chrome requiring ServiceWorker):', err);
    }
  }
}
