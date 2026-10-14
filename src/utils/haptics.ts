export type HapticPattern = 'light' | 'dash' | 'reload' | 'click' | 'heavy';

export function triggerHaptic(pattern: HapticPattern = 'light') {
  try {
    if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
    
    // Check if haptics are enabled in localStorage (default enabled)
    const hapticsEnabled = localStorage.getItem('br_haptics_enabled') !== 'false';
    if (!hapticsEnabled) return;

    switch (pattern) {
    case 'light':
      navigator.vibrate(10);
      break;
    case 'click':
      navigator.vibrate(8);
      break;
    case 'dash':
      navigator.vibrate(30);
      break;
    case 'reload':
      navigator.vibrate([15, 30, 15]);
      break;
    case 'heavy':
      navigator.vibrate(50);
      break;
    default:
      navigator.vibrate(10);
    }
  } catch (err) {
    // Ignore vibration errors on unsupported devices/browsers
    console.debug('Haptic feedback not supported or blocked:', err);
  }
}
