export const WEARABLE_DEFAULTS = {
  RING_TILT: 5,
  RING_SHAKE: 20,
  CANE_TAP: 8,
  CANE_SWING: 3,
  RING_THROTTLE: 8,
  CANE_THROTTLE: 6,
};

export function createWearableInput(handlers = {}) {
  const { RING_TILT, RING_SHAKE, CANE_TAP, CANE_SWING, RING_THROTTLE, CANE_THROTTLE } = WEARABLE_DEFAULTS;
  const throttleMs = handlers.throttleMs ?? 600;
  let ringFrames = 0;
  let caneFrames = 0;
  let lastBeta = 0;
  let lastGamma = 0;
  let listening = false;
  let lastAction = 0;

  function throttle(fn, ms = throttleMs) {
    const now = Date.now();
    if (now - lastAction < ms) return;
    lastAction = now;
    fn?.();
  }

  function onRing(e) {
    ringFrames++;
    if (ringFrames % RING_THROTTLE !== 0) return;
    const beta = e.beta ?? 0;
    const gamma = e.gamma ?? 0;
    const dBeta = Math.abs(beta - lastBeta);
    const dGamma = Math.abs(gamma - lastGamma);
    lastBeta = beta;
    lastGamma = gamma;
    if (dBeta > RING_SHAKE || dGamma > RING_SHAKE) {
      throttle(() => handlers.onRingShake?.());
      return;
    }
    if (beta > RING_TILT) handlers.onRingTiltDown?.();
    else if (beta < -RING_TILT) handlers.onRingTiltUp?.();
    if (gamma > RING_TILT) handlers.onRingTiltRight?.();
    else if (gamma < -RING_TILT) handlers.onRingTiltLeft?.();
  }

  function onCane(e) {
    caneFrames++;
    if (caneFrames % CANE_THROTTLE !== 0) return;
    const a = e.accelerationIncludingGravity || e.acceleration;
    if (!a) return;
    const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
    if (Math.abs(mag - 9.8) > CANE_TAP) {
      throttle(() => handlers.onCaneTap?.());
      return;
    }
    if (Math.abs(a.x || 0) > CANE_SWING) {
      throttle(() => handlers.onCaneSwing?.((a.x || 0) > 0 ? 'right' : 'left'), 800);
    }
  }

  async function requestPermission() {
    let ok = true;
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      ok = (await DeviceOrientationEvent.requestPermission().catch(() => 'denied')) === 'granted';
    }
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      ok = ok && (await DeviceMotionEvent.requestPermission().catch(() => 'denied')) === 'granted';
    }
    return ok;
  }

  function start() {
    if (listening || typeof window === 'undefined') return;
    listening = true;
    window.addEventListener('deviceorientation', onRing);
    window.addEventListener('devicemotion', onCane);
  }

  return { start, requestPermission };
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const attach = () => {
    const btn = document.getElementById('wearable-enable');
    if (!btn) return;
    const input = createWearableInput({
      onRingShake: () => window.onWearableGesture?.('shake', {}),
      onRingTiltUp: () => window.onWearableGesture?.('tilt', { dir: 'up' }),
      onRingTiltDown: () => window.onWearableGesture?.('tilt', { dir: 'down' }),
      onRingTiltLeft: () => window.onWearableGesture?.('tilt', { dir: 'left' }),
      onRingTiltRight: () => window.onWearableGesture?.('tilt', { dir: 'right' }),
      onCaneTap: () => window.onWearableGesture?.('tap', {}),
      onCaneSwing: (dir) => window.onWearableGesture?.('swing', { dir }),
    });
    btn.addEventListener('click', async () => {
      if (await input.requestPermission()) {
        input.start();
        btn.textContent = '戒指/手杖已启用';
      }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach);
  else attach();
}
