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

  // ---------- pictures (avatars.js) ----------
  var A = window.OPTIONAL_AVATARS || {};
  var current = 'curly';
  var grid = $('avgrid');
  Object.keys(A).forEach(function(k){
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'avopt'; b.setAttribute('aria-label', A[k].name); b.dataset.av = k;
    b.innerHTML = A[k].svg;
    b.addEventListener('click', function(){ pickAvatar(k); });
    grid.appendChild(b);
  });
  function setAvatar(k){
    if (!A[k]) k = 'curly';
    current = k;
    var slots = document.querySelectorAll('.av-slot');
    for (var i = 0; i < slots.length; i++) slots[i].innerHTML = A[k].svg;
    var opts = grid.querySelectorAll('.avopt');
    for (var j = 0; j < opts.length; j++) opts[j].setAttribute('aria-pressed', opts[j].dataset.av === k ? 'true' : 'false');
  }
  function pickAvatar(k){
    var before = current;
    setAvatar(k);
    var status = $('av-status');
    status.textContent = 'Saving…';
    app().saveAvatar(k).then(function(){
      status.textContent = 'Saved.';
    }, function(){
      setAvatar(before);
      status.textContent = "That didn't save. Please try again.";
    });
  }
  setAvatar(current);
  $('change-av').addEventListener('click', function(){
    var picker = $('avpicker'), open = picker.hidden;
    picker.hidden = !open;
    this.setAttribute('aria-expanded', open ? 'true' : 'false');
    $('av-status').textContent = '';
  });

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
  var backs = document.querySelectorAll('.inback');
  for (var b = 0; b < backs.length; b++) backs[b].addEventListener('click', goBack);

  // ---------- ☰ menu ----------
  var menu = $('menu'), mscrim = $('menu-scrim'), menuBtn = $('open-menu');
  function openMenu(){
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
  menuBtn.addEventListener('click', openMenu);
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

  // ---------- companion bar ----------
  // Bestie isn't built yet, so typing shows a short note and keeps what they wrote.
  var talk = $('talk'), talkNote = $('talk-note'), noteTimer = null;
  function bestieSoon(){
    talkNote.textContent = '';
    var who = document.querySelector('.who');
    var name = (who && who.textContent) || 'Bestie';
    setTimeout(function(){ talkNote.textContent = name + '\u2019s almost here. Check back soon!'; }, 30);
    clearTimeout(noteTimer);
    noteTimer = setTimeout(function(){ talkNote.textContent = ''; }, 6000);
  }
  document.querySelector('.friendbar .send').addEventListener('click', bestieSoon);
  talk.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); bestieSoon(); } });

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
  function showStep(n){
    var steps = scrim.querySelectorAll('.step');
    for (var i = 0; i < steps.length; i++) steps[i].hidden = steps[i].getAttribute('data-step') !== String(n);
    var h = scrim.querySelector('.step[data-step="' + n + '"] h2');
    if (h){ h.setAttribute('tabindex', '-1'); h.focus(); }
  }
  function resetDots(){ var d = scrim.querySelectorAll('.gdot'); for (var i = 0; i < d.length; i++) d[i].setAttribute('aria-pressed', 'false'); }
  function openPulse(){
    haptic([70, 90, 110]);
    openBtn.classList.remove('beat'); void openBtn.offsetWidth; openBtn.classList.add('beat');
    resetDots(); scrim.hidden = false; document.body.style.overflow = 'hidden'; showStep('intro');
  }
  function closePulse(returnFocus){
    scrim.hidden = true; document.body.style.overflow = '';
    if (returnFocus) openBtn.focus();
  }
  openBtn.addEventListener('click', openPulse);
  $('close-pulse').addEventListener('click', function(){ closePulse(true); });
  $('pulse-done').addEventListener('click', function(){ closePulse(true); });
  $('pulse-talk').addEventListener('click', function(){ closePulse(false); goTo('dash'); });
  scrim.addEventListener('click', function(e){ if (e.target === scrim) closePulse(true); });
  var nexts = scrim.querySelectorAll('[data-next]');
  for (var x = 0; x < nexts.length; x++){
    nexts[x].addEventListener('click', function(){ showStep(this.getAttribute('data-next')); });
  }
  var dots = scrim.querySelectorAll('.gdot');
  for (var d = 0; d < dots.length; d++){
    dots[d].addEventListener('click', function(){
      var on = this.getAttribute('aria-pressed') !== 'true';
      this.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) haptic(25);
    });
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
      var notes = document.querySelectorAll('.hubnote');
      for (var i = 0; i < notes.length; i++) notes[i].textContent = '';
      if (id !== 'dash'){ $('avpicker').hidden = true; $('change-av').setAttribute('aria-expanded', 'false'); }
    },
    closeAll: function(){ closeMenu(false); closePulse(false); talk.value = ''; talkNote.textContent = ''; setAvatar('curly'); }
  };
})();
