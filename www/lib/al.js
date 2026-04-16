// Al — the voice-pipeline module.
// Extracted from mychannel-v5.html (alSpeak, alSpeakStep, processAlCommand).
// Audio handling (fade-in, generation counter, speechSynthesis fallback) is
// byte-preserved from v5 — interface tested over months, do not "improve".
//
// All network calls go through the Vercel proxy at config.proxyBase.
// Proxy routes:
//   POST {proxyBase}/api/elevenlabs  body { text, voiceId }  -> audio/mpeg blob
//   POST {proxyBase}/api/al          body { transcript, context } -> { reply, actions }
//
// ZERO hardcoded URLs. ZERO hardcoded API keys. Init must be called first.

// Extracted verbatim from v5 line 2607.
export const VOICE_LINES = [
  "Hi, I'm Al. Let's build your TV channel from shows you love \u2014 and find some new ones.",
  "You're big on drama and crime. I added comedy too. Change anything you want.",
  "You watch a bit of everything. I'd keep it mixed.",
  "Looks like you're usually on the couch by 7. Sound about right?",
  "Here's your lineup. I threw in Mindhunter \u2014 trust me on that one.",
  "Your week's sorted. Move anything that doesn't feel right.",
  "Nine shows across your week. That's your channel.",
  "You're live. Enjoy.",
];

// Module state preserved from v5 — name-for-name.
let _config = null;
let alCurrentAudio = null;
let alLastSpokenStep = -1;
let alSpeakGen = 0;
let alAudioUnlocked = false;

export function init(config) {
  if (!config || typeof config.proxyBase !== 'string' || !config.proxyBase) {
    throw new Error('al.init requires config.proxyBase');
  }
  if (typeof config.voiceId !== 'string' || !config.voiceId) {
    throw new Error('al.init requires config.voiceId');
  }
  _config = { ...config };
}

export function unlockAudio() {
  alAudioUnlocked = true;
}

export function isAudioUnlocked() {
  return alAudioUnlocked;
}

export function getCurrentAudio() {
  return alCurrentAudio;
}

// v5 alSpeak, line 2624 — TTS with fade-in and speechSynthesis fallback.
// Audio timing IDENTICAL to v5. Only the fetch URL + body shape differ.
export function speak(text) {
  if (!_config) throw new Error('al.init() must be called before al.speak()');

  // Stop any currently playing audio
  if (alCurrentAudio) {
    alCurrentAudio.pause();
    alCurrentAudio.src = '';
    alCurrentAudio = null;
    if (typeof window !== 'undefined') window.alCurrentAudio = null;
  }
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();

  // Generation counter invalidates any in-flight fetches
  const gen = ++alSpeakGen;

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
      if (gen !== alSpeakGen) return;
      const audio = new Audio(URL.createObjectURL(blob));
      alCurrentAudio = audio;
      if (typeof window !== 'undefined') window.alCurrentAudio = audio;
      audio.volume = 0;
      audio.onended = function () {
        if (gen !== alSpeakGen) return;
        alCurrentAudio = null;
        if (typeof window !== 'undefined') window.alCurrentAudio = null;
      };
      return audio
        .play()
        .then(function () {
          // 200ms volume fade-in — preserved verbatim from v5
          const fadeStart = performance.now();
          function fadeIn(now) {
            const elapsed = now - fadeStart;
            audio.volume = Math.max(0, Math.min(1, elapsed / 200));
            if (elapsed < 200) requestAnimationFrame(fadeIn);
          }
          requestAnimationFrame(fadeIn);
        })
        .catch(function () {});
    })
    .catch(function () {
      if (gen !== alSpeakGen) return;
      // Fallback to browser TTS — BATTLE-TESTED V5 CODE, DO NOT IMPROVE
      if (typeof speechSynthesis === 'undefined') return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05;
      speechSynthesis.speak(u);
    });
}

// v5 alSpeakStep, line 2686 — gates speaking once per step.
// 'introActive' gate from v5 is now the caller's responsibility (pass opts.blocked=true to skip).
export function speakStep(step, opts = {}) {
  if (!alAudioUnlocked) return;
  if (opts.blocked) return;
  if (step === alLastSpokenStep) return;
  if (step < 0 || step >= VOICE_LINES.length) return;
  alLastSpokenStep = step;
  return speak(VOICE_LINES[step]);
}

export function resetSpokenStep() {
  alLastSpokenStep = -1;
}

// v5 processAlCommand, line 2092 — was a direct Anthropic call with tools.
// Refactored per DESIGN.md §5: proxy handles the Claude tool-use loop.
// Module just POSTs transcript+context and returns structured { reply, actions }.
// Caller executes actions against its own state.
export function processCommand(text, context) {
  if (!_config) throw new Error('al.init() must be called before al.processCommand()');
  return fetch(_config.proxyBase + '/api/al', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript: text, context: context || {} }),
  }).then(function (res) {
    if (!res.ok) throw new Error('proxy ' + res.status);
    return res.json();
  });
}
