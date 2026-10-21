// PWA install helper: Chrome/Edge/Android fire "beforeinstallprompt"; iOS has no prompt (Share > Add to Home Screen).
let deferred: any = null
export function installState(): 'installed' | 'available' | 'ios' | 'unavailable' {
  if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) return 'installed'
  if (deferred) return 'available'
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return 'ios'
  return 'unavailable'
}
export async function promptInstall() { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; window.dispatchEvent(new Event('lexon-install')) }
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; window.dispatchEvent(new Event('lexon-install')) })
window.addEventListener('appinstalled', () => { deferred = null; window.dispatchEvent(new Event('lexon-install')) })
