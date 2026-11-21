// =========================================================
// OPTIONAL — the pages inside the app (after logging in)
// Options page, the ☰ menu, Pulse, the dashboard and Help if Needed.
// Page switching and accounts live in app.js (window.OptionalApp).
// =========================================================
(function(){
  function $(id){ return document.getElementById(id); }
  function app(){ return window.OptionalApp; }

  // ---------- daily quote ----------
  // One quote a day, in the order of quotes.js, then it starts over.
  function showQuote(){
    var Q = window.OPTIONAL_QUOTES || [];
    if (!Q.length) return;
    var now = new Date();
    var day = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(2026, 0, 1)) / 86400000);
    var q = Q[((day % Q.length) + Q.length) % Q.length];
    $('daily-words').textContent = '“' + q.text + '”';
    $('daily-by').textContent = q.by;
    $('daily').classList.toggle('long', q.text.length > 110);
  }

  // ---------- your picture in every .av-slot (the picker lives in dash.js) ----------
  var A = window.OPTIONAL_AVATARS || {};
  function setAvatar(k){
    if (!A[k]) k = 'curly';
    var slots = document.querySelectorAll('.av-slot');
    for (var i = 0; i < slots.length; i++) slots[i].innerHTML = A[k].svg;
  }
  setAvatar('curly');

  // ---------- "coming soon" for pages that aren't built yet ----------
  function soonNote(button){
    var page = button.closest('section, nav');
    var note = page && page.querySelector('.hubnote, .menunote');
    if (note) note.textContent = 'Coming soon.';
  }
  var soons = document.querySelectorAll('.soon-btn');
  for (var s = 0; s < soons.length; s++){
    soons[s].addEventListener('click', function(){ soonNote(this); });
  }

  // ---------- moving between in-app pages ----------
  var stepsIn = 0;   // how many in-app pages deep we are, so Back returns to the right place
  function goTo(id){
    var here = location.hash.replace('#', '');
    if (here === id) return;
    if (id !== 'options') stepsIn++;
    app().go(id);
  }
  function goBack(){
    if (stepsIn > 0){ stepsIn--; history.back(); }
    else { app().go('options'); }
  }
  $('open-dash').addEventListener('click', function(){ goTo('dash'); });
  var worlds = document.querySelectorAll('[data-world]');
  for (var w = 0; w < worlds.length; w++) worlds[w].addEventListener('click', function(){ if (typeof closeMenu === 'function') closeMenu(false); goTo('world'); });
  var backs = document.querySelectorAll('.inback');
  for (var b = 0; b < backs.length; b++) backs[b].addEventListener('click', goBack);

  // ---------- ☰ menu ----------
  var menu = $('menu'), mscrim = $('menu-scrim'), menuBtn = $('open-menu');
  // Every in-app page has a menu button; remember which one opened it so focus returns there.
  function openMenu(e){
    if (e && e.currentTarget) menuBtn = e.currentTarget;
    menu.hidden = false; mscrim.hidden = false;
    document.body.classList.add('hide-bar');
    menuBtn.setAttribute('aria-expanded', 'true');
    $('menu-note').textContent = '';
    menu.querySelector('.menulist button').focus();
  }
  function closeMenu(returnFocus){
    menu.hidden = true; mscrim.hidden = true;
    document.body.classList.remove('hide-bar');
    menuBtn.setAttribute('aria-expanded', 'false');
    if (returnFocus) menuBtn.focus();
  }
  var menuBtns = document.querySelectorAll('#open-menu, .menubtn');
  for (var mb = 0; mb < menuBtns.length; mb++) menuBtns[mb].addEventListener('click', openMenu);
  $('close-menu').addEventListener('click', function(){ closeMenu(true); });
  mscrim.addEventListener('click', function(){ closeMenu(true); });
  var gotos = menu.querySelectorAll('[data-goto]');
  for (var g = 0; g < gotos.length; g++){
    gotos[g].addEventListener('click', function(){
      var dest = this.getAttribute('data-goto');
      closeMenu(false);
      if (dest === 'options'){ stepsIn = 0; app().go('options'); }
      else goTo(dest);
    });
  }

  // ---------- companion bar: sends what they typed to the Friend on the dashboard ----------
  var talk = $('talk');
  function fromBar(){
    var t = talk.value; talk.value = '';
    goTo('dash');
    if (window.OptionalDash) OptionalDash.sendFromBar(t);
  }
  document.querySelector('.friendbar .send').addEventListener('click', fromBar);
  talk.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); fromBar(); } });

  // ---------- Pulse: haptics + 5, 4, 3, 2, 1 grounding ----------
  var scrim = $('pulse-scrim'), openBtn = $('open-pulse');
  var canVibrate = typeof navigator.vibrate === 'function';
  function iosTick(){
    // Safari on iPhone has no vibration API; toggling a hidden switch gives one light tap on iOS 17.4+.
    try {
      var l = document.createElement('label'), c = document.createElement('input');
      c.type = 'checkbox'; c.setAttribute('switch', ''); l.appendChild(c);
      l.style.cssText = 'position:fixed;opacity:0;pointer-events:none;left:-99px';
      document.body.appendChild(l); l.click(); document.body.removeChild(l);
    } catch (e){}
  }
  function haptic(pattern){
    if (canVibrate){ try { navigator.vibrate(pattern); return; } catch (e){} }
    iosTick();
  }
  // ---------- Pulse bubbles: pop sound, pop burst, and the Grounded ending ----------
  var CREASE = '<svg class="crease" aria-hidden="true" viewBox="0 0 44 44" fill="none" stroke="rgba(90,58,20,.55)" stroke-width="1" stroke-linecap="round"><path d="M22 22 L13 9 M22 22 L33 8 M22 22 L37 25 M22 22 L28 37 M22 22 L11 34 M22 22 L6 20"/><path d="M16 14 l3 -1 M31 15 l-1 2.5 M32 29 l-3 -1 M17 31 l2 -2.5" stroke-width=".8"/></svg>';
  var audio = null;
  function popSound(){
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      var t = audio.currentTime, len = Math.floor(audio.sampleRate * 0.05), buf = audio.createBuffer(1, len, audio.sampleRate), data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
      var src = audio.createBufferSource(); src.buffer = buf;
      var bp = audio.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300 + Math.random() * 400; bp.Q.value = 1.2;
      var g1 = audio.createGain(); g1.gain.value = 0.35;
      src.connect(bp); bp.connect(g1); g1.connect(audio.destination); src.start(t);
      var o = audio.createOscillator(), g2 = audio.createGain();
      o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.07);
      g2.gain.setValueAtTime(0.25, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      o.connect(g2); g2.connect(audio.destination); o.start(t); o.stop(t + 0.09);
    } catch (e){}
  }
  function burstOn(b, shards){
    var f = document.createElement('span'); f.className = 'pop-flash'; b.appendChild(f);
    var r = document.createElement('span'); r.className = 'pop-ring'; b.appendChild(r);
    for (var i = 0; i < shards; i++){ var s = document.createElement('span'); s.className = 'pop-shard'; s.style.setProperty('--r', (i * (360 / shards) + Math.random() * 20) + 'deg'); b.appendChild(s); }
    setTimeout(function(){ var x = b.querySelectorAll('.pop-flash,.pop-ring,.pop-shard'); for (var k = 0; k < x.length; k++) x[k].remove(); }, 460);
  }
  function popBubble(b){
    if (b.classList.contains('popped') || b.classList.contains('press')) return;
    b.classList.add('press');
    setTimeout(function(){ b.classList.remove('press'); b.classList.add('popped'); b.setAttribute('aria-pressed', 'true'); popSound(); haptic(30); burstOn(b, 6); }, 110);
  }
  var sheet = scrim.querySelector('.sheet'), endingBits = [], endingTimers = [];
  function later(fn, ms){ endingTimers.push(setTimeout(fn, ms)); }
  function clearEnding(){
    for (var i = 0; i < endingTimers.length; i++) clearTimeout(endingTimers[i]);
    endingTimers = [];
    for (var k = 0; k < endingBits.length; k++) endingBits[k].remove();
    endingBits = [];
    if (sheet) sheet.style.minHeight = '';
    var s = scrim.querySelectorAll('.step'); for (var n = 0; n < s.length; n++) s[n].classList.remove('arrive', 'exhaling');
  }
  function groundedEnding(){
    clearEnding();
    var g1 = scrim.querySelector('[data-step="g1"]'), endStep = scrim.querySelector('[data-step="end"]');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    endStep.style.visibility = 'hidden'; endStep.hidden = false; var eh = endStep.offsetHeight; endStep.hidden = true; endStep.style.visibility = '';
    sheet.style.minHeight = Math.min(Math.max(sheet.offsetHeight, 600, eh + 260), window.innerHeight * 0.88) + 'px';
    var scene = document.createElement('div'); scene.className = 'pulse-scene'; scene.setAttribute('aria-hidden', 'true');
    if (reduce){
      sheet.appendChild(scene); endingBits.push(scene); scene.classList.add('on', 'muted'); showStep('end'); return;
    }
    g1.classList.add('exhaling');
    later(function(){
      g1.classList.remove('exhaling');
      var s = scrim.querySelectorAll('.step'); for (var n = 0; n < s.length; n++) s[n].hidden = true;
      sheet.appendChild(scene); endingBits.push(scene); void scene.offsetWidth; scene.classList.add('on');
      var W = sheet.clientWidth, H = sheet.clientHeight, pts = [], tries = 0, fbs = [];
      while (pts.length < 15 && tries < 2000){
        tries++;
        var px = W * (0.14 + Math.random() * 0.72), py = H * (0.14 + Math.random() * 0.72), ok = true;
        for (var q = 0; q < pts.length; q++){ if (Math.hypot(pts[q][0] - px, pts[q][1] - py) < 58){ ok = false; break; } }
        if (ok) pts.push([px, py]);
      }
      pts.forEach(function(pt, i){
        var w = document.createElement('div'); w.className = 'pulse-fb';
        var sc = 0.82 + Math.random() * 0.33; w.setAttribute('data-sc', sc);
        w.style.left = pt[0] + 'px'; w.style.top = pt[1] + 'px'; w.style.transform = 'scale(' + sc + ')';
        w.innerHTML = '<span class="gdot">' + CREASE + '</span>';
        w.firstChild.style.animationDelay = (i * 70 + Math.random() * 40) + 'ms';
        scene.appendChild(w); fbs.push(w);
      });
      later(function(){
        var bs = fbs.map(function(w){ return w.firstChild; });
        bs.forEach(function(b){ b.classList.add('press'); });
        later(function(){
          popSound(); later(popSound, 12); later(popSound, 24); haptic(60);
          bs.forEach(function(b){ b.classList.remove('press'); b.classList.add('popped'); burstOn(b, 5); });
          scene.classList.add('muted');
          later(function(){
            var cx = W / 2, cy = H / 2;
            fbs.forEach(function(w){
              var x = parseFloat(w.style.left), y = parseFloat(w.style.top), r = Math.random() * 44, a = Math.random() * Math.PI * 2;
              var nx = (x < cx ? 36 : W - 36) + (x < cx ? 1 : -1) * Math.abs(Math.cos(a) * r);
              var ny = (y < cy ? 38 : H - 38) + (y < cy ? 1 : -1) * Math.abs(Math.sin(a) * r);
              var dur = 1.9 + Math.random() * 1.1;
              w.style.transitionDuration = dur + 's,' + dur + 's,' + dur + 's,' + (dur + 0.4) + 's';
              w.style.transitionDelay = (Math.random() * 0.25) + 's';
              w.classList.add('spread'); w.style.left = nx + 'px'; w.style.top = ny + 'px';
              w.style.transform = 'scale(' + w.getAttribute('data-sc') + ') rotate(' + (Math.random() * 50 - 25) + 'deg)';
            });
          }, 500);
          later(function(){ showStep('end'); endStep.classList.remove('arrive'); void endStep.offsetWidth; endStep.classList.add('arrive'); }, 1700);
        }, 160);
      }, 14 * 70 + 40 + 600 + 120 + 1100);
    }, 1000);
  }

  function showStep(n){
    var steps = scrim.querySelectorAll('.step');
    for (var i = 0; i < steps.length; i++) steps[i].hidden = steps[i].getAttribute('data-step') !== String(n);
    var h = scrim.querySelector('.step[data-step="' + n + '"] h2');
    if (h){ h.setAttribute('tabindex', '-1'); h.focus(); }
  }
  function resetDots(){
    clearEnding();
    var d = scrim.querySelectorAll('.gdots .gdot');
    for (var i = 0; i < d.length; i++){ d[i].classList.remove('popped', 'press'); d[i].setAttribute('aria-pressed', 'false'); if (!d[i].querySelector('svg')) d[i].innerHTML = CREASE; }
  }
  function openPulse(withPulse){
    // A hold already pulsed. Opening straight away (keyboard, screen reader) pulses here instead.
    if (withPulse){ if (!canVibrate) iosTick(); else startHeartbeat(); }
    openBtn.classList.remove('beat'); void openBtn.offsetWidth; openBtn.classList.add('beat');
    resetDots(); scrim.hidden = false; document.body.style.overflow = 'hidden'; showStep('intro');
  }
  function closePulse(returnFocus){
    clearEnding();
    scrim.hidden = true; document.body.style.overflow = '';
    if (returnFocus) openBtn.focus();
  }
  // ---------- Pulse is held: it pulses for about 5 seconds while held, a ring fills, then grounding opens ----------
  var HEARTBEAT = [70,120,110,700, 70,120,110,750, 70,120,110,800, 70,120,110,850, 70,120,140]; // about 5 seconds, easing as it goes
  var HOLD_MS = 5000;
  function startHeartbeat(){ if (!canVibrate) return; try { navigator.vibrate(HEARTBEAT); } catch (e){} }
  function stopHeartbeat(){ if (!canVibrate) return; try { navigator.vibrate(0); } catch (e){} }
  // A small torn-paper note that fades, for a quick tap.
  var note = document.createElement('p'); note.className = 'holdnote'; note.setAttribute('role', 'status'); note.hidden = true;
  document.body.appendChild(note);
  var noteTimer = null;
  function holdNote(){
    note.textContent = 'Hold the heartbeat for a few seconds.';
    note.hidden = false; note.classList.remove('fade'); void note.offsetWidth;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(function(){ note.classList.add('fade'); noteTimer = setTimeout(function(){ note.hidden = true; }, 400); }, 3000);
  }
  // Every Pulse button works the same way: hold it and a ring fills while it pulses.
  function makeHold(btn){
    if (!btn) return;
    btn.classList.add('holdable');
    // The filling ring, drawn around the button so everyone can see the hold, not only feel it.
    btn.insertAdjacentHTML('beforeend', '<svg class="holdring" aria-hidden="true" viewBox="0 0 44 44"><circle cx="22" cy="22" r="19"/></svg>');
    var holdTimer = null, lastPointer = 0;
    function endHold(){ clearTimeout(holdTimer); holdTimer = null; btn.classList.remove('holding'); }
    btn.addEventListener('pointerdown', function(e){
      if (e.button && e.button !== 0) return;
      e.preventDefault();
      lastPointer = Date.now();
      try { btn.setPointerCapture(e.pointerId); } catch (err){}
      startHeartbeat(); if (!canVibrate) iosTick();
      btn.classList.remove('holding'); void btn.offsetWidth; btn.classList.add('holding');
      holdTimer = setTimeout(function(){ endHold(); openPulse(false); }, HOLD_MS);
    });
    function letGo(){
      lastPointer = Date.now();
      if (!holdTimer) return;           // already opened
      endHold(); stopHeartbeat(); holdNote();
    }
    btn.addEventListener('pointerup', letGo);
    btn.addEventListener('pointercancel', letGo);
    btn.addEventListener('contextmenu', function(e){ e.preventDefault(); });
    // Keyboard and screen readers can't hold, so for them the button opens Pulse straight away.
    btn.addEventListener('click', function(){
      if (Date.now() - lastPointer < 800) return;   // a finger or mouse already handled it
      openPulse(true);
    });
  }
  makeHold(openBtn);
  makeHold($('dash-pulse'));
  $('close-pulse').addEventListener('click', function(){ closePulse(true); });
  $('pulse-done').addEventListener('click', function(){ closePulse(true); });
  $('pulse-talk').addEventListener('click', function(){ closePulse(false); goTo('dash'); });
  scrim.addEventListener('click', function(e){ if (e.target === scrim) closePulse(true); });
  var nexts = scrim.querySelectorAll('[data-next]');
  for (var x = 0; x < nexts.length; x++){
    nexts[x].addEventListener('click', function(){ var n = this.getAttribute('data-next'); if (n === 'end') groundedEnding(); else showStep(n); });
  }
  var dots = scrim.querySelectorAll('.gdots .gdot');
  for (var d = 0; d < dots.length; d++){
    dots[d].innerHTML = CREASE;
    dots[d].addEventListener('pointerdown', function(){ popBubble(this); });
    dots[d].addEventListener('click', function(e){ if (e.detail === 0) popBubble(this); }); // keyboard and screen readers
  }

  // Escape closes whatever is open on top.
  document.addEventListener('keydown', function(e){
    if (e.key !== 'Escape') return;
    if (!scrim.hidden) closePulse(true);
    else if (!menu.hidden) closeMenu(true);
  });

  // ---------- what app.js calls ----------
  window.OptionalInApp = {
    setAvatar: setAvatar,
    onShow: function(id){
      if (id === 'options'){ stepsIn = 0; showQuote(); }
      if (id === 'world' && window.OptionalWorld) OptionalWorld.show();
      var notes = document.querySelectorAll('.hubnote');
      for (var i = 0; i < notes.length; i++) notes[i].textContent = '';
    },
    closeAll: function(){ closeMenu(false); closePulse(false); talk.value = ''; setAvatar('curly'); }
  };
})();
