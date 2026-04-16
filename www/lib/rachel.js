// Rachel — cinematic-intro narration module.
// Extracted from mychannel-v5.html (preloadRachelAudio, playRachelClip,
// stopRachelAudio, and the timeupdate cue-driven scene trigger loop).
//
// v5 uses a single continuous Rachel audio clip with a timeupdate listener
// that fires scene transitions at percentage thresholds of total duration.
// The prompt's "SCRIPTS" plural was a misread of v5 — v5 has ONE script
// (RACHEL_SCRIPT, line 3081) preserved verbatim below. CUE_POINTS preserved
// verbatim from v5 lines 3397–3403.
//
// Audio handling (fade-in 400ms, play() promise chain, catch swallow)
// is byte-preserved from v5.
//
// All network calls go through the Vercel proxy at config.proxyBase:
//   POST {proxyBase}/api/elevenlabs  body { text, voiceId }  -> audio/mpeg blob
//
// ZERO hardcoded URLs. ZERO hardcoded API keys. Init must be called first.

// v5 line 3081 — RACHEL_SCRIPT verbatim.
export const RACHEL_SCRIPT =
  "There was a time when you'd switch on the TV... and something great was just there. " +
  "You didn't have to choose. You didn't have to scroll. You just watched. ... " +
  "What if you could have that feeling again \u2014 that ease \u2014 " +
  "but only with the shows you love? ... " +
  "Your own personal TV channel \u2014 that you create, from your Netflix favourites. " +
  "Imagine that... Your own channel. With only the shows you want to watch. " +
  "And when YOU want to watch them. ... " +
  "The best of both worlds. Let's build yours.";

// Shape the rest of the codebase can import — one key only, matches v5.
export const SCRIPTS = Object.freeze({ intro: RACHEL_SCRIPT });

// v5 lines 3397–3403 — cue fractions of total audio duration. Verbatim.
export const CUE_POINTS = Object.freeze({
  SUB2:  0.28,  // hide sub 1, show sub 2 slot
  S2:    0.29,  // "What if you could..."
  SUB3:  0.51,
  S3:    0.52,  // "Your own personal TV channel..."
  SUB3B: 0.66,  // "Your own channel. With only..."
  SUB4:  0.81,
  S4:    0.82,  // "The best of both worlds..."
});

let _config = null;
let rachelAudio = null;
let rachelAudioReady = false;

export function init(config) {
  if (!config || typeof config.proxyBase !== 'string' || !config.proxyBase) {
    throw new Error('rachel.init requires config.proxyBase');
  }
  if (typeof config.voiceId !== 'string' || !config.voiceId) {
    throw new Error('rachel.init requires config.voiceId');
  }
  _config = { ...config };
}

export function isReady() {
  return rachelAudioReady;
}

// v5 preloadRachelAudio, line 3083 — fire-and-forget preload.
// Accepts optional script override; defaults to RACHEL_SCRIPT.
export function preload(scriptOverride) {
  if (!_config) throw new Error('rachel.init() must be called before rachel.preload()');
  const text = scriptOverride || RACHEL_SCRIPT;
  return fetch(_config.proxyBase + '/api/elevenlabs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId: _config.voiceId }),
  })
    .then(function (res) {
      if (!res.ok) throw new Error('proxy ' + res.status);
      return res.blob();
    })
    .then(function (blob) {
      rachelAudio = new Audio(URL.createObjectURL(blob));
      rachelAudioReady = true;
    })
    .catch(function () {});
}

// v5 playRachelClip, line 3101 — plays preloaded clip with fade-in.
// Returns boolean: true if playback started, false if audio not loaded.
export function playClip() {
  if (!rachelAudio || !rachelAudioReady) return false;
  rachelAudio.volume = 0;
  rachelAudio
    .play()
    .then(function () {
      const start = performance.now();
      function fadeIn(now) {
        const t = Math.min((now - start) / 400, 1);
        try { rachelAudio.volume = Math.max(0, Math.min(1, t)); } catch (e) {}
        if (t < 1) requestAnimationFrame(fadeIn);
      }
      requestAnimationFrame(fadeIn);
    })
    .catch(function () {});
  return true;
}

// v5 stopRachelAudio, line 3119.
export function stop() {
  if (rachelAudio) {
    try {
      rachelAudio.pause();
      rachelAudio.currentTime = 0;
    } catch (e) {}
  }
}

// v5 lines 3394–3455 — narrateScene binds a timeupdate listener that fires
// named cue callbacks as audio crosses percentage thresholds.
//
// cuePoints: { cueName: fractionOfDuration, ... }
// onCue(cueName): called once per cue
// onFallback(): called if audio isn't loaded (caller should fire fixed timers)
//
// Returns boolean: true if audio-driven cues are running, false if fallback fired.
export function narrateScene(cuePoints, onCue, onFallback) {
  if (!rachelAudio || !rachelAudioReady) {
    if (typeof onFallback === 'function') onFallback();
    return false;
  }
  if (!playClip()) {
    if (typeof onFallback === 'function') onFallback();
    return false;
  }

  const fired = Object.create(null);

  function onTime() {
    if (!rachelAudio) {
      rachelAudio && rachelAudio.removeEventListener('timeupdate', onTime);
      return;
    }
    const dur = rachelAudio.duration;
    if (!dur || !isFinite(dur)) return;
    const pct = rachelAudio.currentTime / dur;
    for (const key of Object.keys(cuePoints)) {
      if (fired[key]) continue;
      if (pct >= cuePoints[key]) {
        fired[key] = true;
        try { onCue(key); } catch (e) {}
      }
    }
  }

  rachelAudio.addEventListener('timeupdate', onTime);
  return true;
}

// Test/debug helper — lets test code inspect internal state without exposing
// rachelAudio. Reset ready flag after preload failure, for example.
export function _reset() {
  if (rachelAudio) { try { rachelAudio.pause(); } catch (e) {} }
  rachelAudio = null;
  rachelAudioReady = false;
}
