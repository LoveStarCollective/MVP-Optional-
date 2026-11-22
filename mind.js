// ===== Mind Body Connect =====
// Every activity can be hidden with the eyelids, and so can each video inside one.
// To add a video later: put { id:'YouTubeID', title:'…', by:'Creator', mins:10, channel:'https://www.youtube.com/@channel' } in that activity's videos list.
(function(){
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  var LIDS = '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5c2.4 3.2 5.4 4.8 9 4.8s6.6-1.6 9-4.8"/><path d="M5.6 13.4l-1.6 2.2"/><path d="M9.6 15l-.6 2.7"/><path d="M14.4 15l.6 2.7"/><path d="M18.4 13.4l1.6 2.2"/></svg>';
  var PINS = ['amber','green','blue','pink','red'];

  // ---------- the activities ----------
  // "why" lines are drafts for Astride to edit. They stay general, with no medical claims.
  var ACTS = [
    { key:'breath', name:'Breath work', tool:'breath',
      what:'Slow, steady breathing, paced by a circle that grows and shrinks.',
      why:'Many people find that slowing the breath, especially a longer breath out, helps the body settle when things feel like a lot.' },
    { key:'ground', name:'Grounding', tool:'ground',
      what:'Bringing your attention back to right here, through your senses and your body.',
      why:'Noticing what you can see, hear and feel can pull attention out of a spiral and back into the present.' },
    { key:'meditate', name:'Meditation', tool:'meditate', videos:[],
      what:'Sitting with your breath and your thoughts for a few minutes, without needing to fix anything.',
      why:'A regular practice can make it easier to notice thoughts and urges without acting on them right away.' },
    { key:'nidra', name:'Yoga Nidra', videos:[
        { id:'Ij4AVDPr9Qk', title:'36 Minute Yoga Nidra', by:'Liberation Yoga', mins:36 },
        { id:'3Umb6SpJdmA', title:'Healing Yoga Nidra', by:'Shaylee Taylor, Liberation Yoga' },
        { id:'5wqXvdr3bGw', title:'35 Minute Yoga Nidra', by:'Liberation Yoga', mins:35 } ],
      what:'A guided rest, usually lying down, where a voice walks you through your body and breath.',
      why:'It’s a way to rest deeply without having to do anything. Many people use it to unwind or before sleep.' },
    { key:'sounds', name:'Calming sounds', tool:'sounds', videos:[ { id:'VU0mIwdZFAA', title:'Singing bowl with water', by:'WaterSong Singing Bowl' },
        { id:'GS7_ufjA7lQ', title:'Singing bowl sound bath', by:'Healing Vibrations' } ],
      what:'Rain, ocean, a crackling fire or soft noise, made right here in the app.',
      why:'Steady, gentle sound can give a busy mind something easy to rest on.' },
    { key:'odd', name:'Oddly Satisfying', tool:'odd', videos:[],
      what:'Popping, slicing, squishing and crumpling. Do it yourself here, or watch it happen.',
      why:'Small, repetitive, tidy things can be absorbing in a calming way, and a nice break for the mind.' },
    { key:'dump', name:'Brain Dump', tool:'dump',
      what:'Writing down everything in your head, fast, with no rules.',
      why:'Getting thoughts out of your head and onto the page can make them feel lighter and easier to sort.' },
    { key:'affirm', name:'Words of affirmation', tool:'affirm',
      what:'Short, kind words to sit with.',
      why:'A few gentle words can soften the voice in your head on a hard day.' },
    { key:'art', name:'Art therapy', tool:'art',
      what:'Drawing or doodling, just for you. No skill needed.',
      why:'Making marks can be a way to express a feeling you don’t have words for yet.' },
    { key:'collage', name:'Collaging', tool:'collage',
      what:'Putting pictures, colors and words together into something that feels like you.',
      why:'Choosing and arranging things can be calming, and can show you what you’re drawn to.' },
    { key:'music', name:'Music therapy', tool:'music', videos:[],
      what:'Using music on purpose, to sit with a feeling or to shift it.',
      why:'Music can meet you where you are, then help move you somewhere else.' },
    { key:'yoga', name:'Yoga', videos:[ { id:'24qDdn2QXjk', title:'Hip opener yoga', by:'Caitlin Keli Yoga' },
        { id:'NuT7zDMZJWg', title:'Yoga flow', by:'Flows by Erica Chen' },
        { id:'7ioGKENAmVc', title:'Yoga flow', by:'Flows by Erica Chen' },
        { id:'KqBkR-pKza8', title:'Yoga flow', by:'Flows by Erica Chen' } ],
      what:'Gentle movement and breath together.',
      why:'Moving with your breath can help you reconnect with your body and notice what it’s telling you.' },
    { key:'taichi', name:'Tai chi', videos:[ { id:'-zLXGinTAWQ', title:'5 Minute “Follow Me” Tai Chi', by:'Taichi for beginners', mins:5 } ],
      what:'Slow, flowing movements done with steady breathing.',
      why:'The slow pace asks for your full attention, which can quiet a busy mind.' },
    { key:'pilates', name:'Pilates', videos:[],
      what:'Slow, controlled movements that focus on your core and breath.',
      why:'Paying close attention to how you move can be its own kind of focus.' },
    { key:'stretch', name:'Stretching', videos:[],
      what:'Easy stretches to loosen up where you hold tension.',
      why:'Noticing where you’re tight is a way of listening to your body.' }
  ];
  function act(k){ for (var i = 0; i < ACTS.length; i++) if (ACTS[i].key === k) return ACTS[i]; }

  // ---------- hiding ----------
  var hidden = [];
  try { hidden = JSON.parse(localStorage.getItem('optional-mind-hidden') || '[]'); } catch (e){}
  function save(){ try { localStorage.setItem('optional-mind-hidden', JSON.stringify(hidden)); } catch (e){} }
  function labelFor(k){ if (k.indexOf('v:') === 0){ for (var i = 0; i < ACTS.length; i++){ var v = (ACTS[i].videos || []).filter(function(x){ return 'v:' + x.id === k; })[0]; if (v) return v.title + ' (video)'; } return 'A video'; } var a = act(k); return a ? a.name : k; }
  var lastHidden = null, tt = null;
  function toast(msg, undo){
    var t = $('m-toast'); t.textContent = msg; t.hidden = false; t.classList.remove('fade');
    if (undo){ var u = document.createElement('button'); u.type = 'button'; u.className = 'wundo'; u.textContent = 'Undo';
      u.addEventListener('click', function(){ var i = hidden.indexOf(lastHidden); if (i !== -1){ hidden.splice(i, 1); save(); } t.hidden = true; drawList(); if (open) drawSheet(open); });
      t.appendChild(document.createTextNode(' ')); t.appendChild(u); }
    clearTimeout(tt); tt = setTimeout(function(){ t.classList.add('fade'); tt = setTimeout(function(){ t.hidden = true; }, 400); }, 3500);
  }
  function hide(k){ hidden.push(k); save(); lastHidden = k; toast(labelFor(k) + ' hidden.', true); }

  // ---------- the list ----------
  function drawList(){
    var list = $('m-list'); list.innerHTML = '';
    ACTS.forEach(function(a, i){
      if (hidden.indexOf(a.key) !== -1) return;
      var li = document.createElement('li'); li.className = 'mrow';
      li.innerHTML = '<button type="button" class="mstrip tear' + (i % 5) + ' pin-' + PINS[i % 5] + '">' + esc(a.name) + '</button>' +
        '<button type="button" class="feye" aria-label="Hide ' + esc(a.name) + '">' + LIDS + '</button>';
      li.querySelector('.mstrip').addEventListener('click', function(){ openSheet(a.key); });
      li.querySelector('.feye').addEventListener('click', function(){ hide(a.key); drawList(); });
      list.appendChild(li);
    });
    var box = $('m-hidden'), hl = $('m-hidlist');
    box.hidden = !hidden.length;
    $('m-hidcount').textContent = hidden.length ? '(' + hidden.length + ')' : '';
    hl.innerHTML = '';
    hidden.forEach(function(k){
      var li = document.createElement('li'); li.innerHTML = '<span>' + esc(labelFor(k)) + '</span>';
      var b = document.createElement('button'); b.type = 'button'; b.className = 'linkbtn'; b.textContent = 'Bring back'; b.setAttribute('aria-label', 'Bring back ' + labelFor(k));
      b.addEventListener('click', function(){ var i = hidden.indexOf(k); if (i !== -1){ hidden.splice(i, 1); save(); } drawList(); $('m-hidtoggle').focus(); });
      li.appendChild(b); hl.appendChild(li);
    });
  }
  $('m-hidtoggle').addEventListener('click', function(){ var o = this.getAttribute('aria-expanded') !== 'true'; this.setAttribute('aria-expanded', o ? 'true' : 'false'); $('m-hidlist').hidden = !o; });

  // ---------- the activity sheet ----------
  var open = null, opener = null, stopTool = null;
  function openSheet(k){ opener = document.activeElement; open = k; drawSheet(k); $('m-scrim').hidden = false; document.body.style.overflow = 'hidden'; var h = $('m-title'); h.setAttribute('tabindex', '-1'); h.focus(); }
  function closeSheet(){ if (stopTool){ try { stopTool(); } catch (e){} stopTool = null; } $('m-scrim').hidden = true; document.body.style.overflow = ''; open = null; if (opener && opener.focus) opener.focus(); }
  $('m-close').addEventListener('click', closeSheet);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !$('m-scrim').hidden) closeSheet(); });
  function drawSheet(k){
    if (stopTool){ try { stopTool(); } catch (e){} stopTool = null; }
    var a = act(k), body = $('m-body'), sh = document.querySelector('.msheet');
    PINS.forEach(function(p){ sh.classList.remove('pc-' + p); }); sh.classList.add('pc-' + PINS[ACTS.indexOf(a) % 5]);
    $('m-title').textContent = a.name;
    body.innerHTML = '<p class="mwhat">' + esc(a.what) + '</p><div class="mwhy"><span class="mwhylbl">Why it may help</span><p>' + esc(a.why) + '</p></div><div class="mtool" id="m-tool"></div><div id="m-vids"></div>';
    if (a.tool && TOOLS[a.tool]) stopTool = TOOLS[a.tool]($('m-tool')) || null;
    if (a.videos){
      var vb = $('m-vids'), all = a.videos.filter(function(v){ return hidden.indexOf('v:' + v.id) === -1; });
      if (all.length){ drawVideos(k, a, vb, all); }
      else if (!a.tool){ vb.innerHTML = '<p class="msoon">Videos are on the way. We\u2019re asking creators for their okay first.</p>'; }
    }
  }

  // Videos: small cards, length pills, and "Show more" so a long list stays easy to browse.
  var LENGTHS = [ { name:'All', ok:function(){ return true; } },
                  { name:'Under 10 min', ok:function(m){ return m && m < 10; } },
                  { name:'10\u201330 min', ok:function(m){ return m && m >= 10 && m <= 30; } },
                  { name:'Longer', ok:function(m){ return m && m > 30; } } ];
  var PAGE = 4;
  function homeScreen(){
    try { return window.navigator.standalone === true || (window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: minimal-ui)').matches)); } catch (e){ return false; }
  }
  function drawVideos(k, a, vb, all){
    var len = 0, shown = PAGE;
    vb.innerHTML = '<h3 class="mh3">' + (a.tool ? 'Or watch' : 'Videos') + ' <span class="mvcount">(' + all.length + ')</span></h3>';
    if (all.length > 1) choices(vb, LENGTHS.map(function(x){ return x.name; }), function(i){ len = i; shown = PAGE; list(); }, 'Video length');
    var ul = document.createElement('ul'); ul.className = 'mvlist'; vb.appendChild(ul);
    var more = document.createElement('button'); more.type = 'button'; more.className = 'linkbtn mmore'; vb.appendChild(more);
    more.addEventListener('click', function(){ var first = shown; shown += PAGE; list(); var nx = ul.children[first]; if (nx){ var b = nx.querySelector('.mthumb'); if (b) b.focus(); } });
    function list(){
      var fit = all.filter(function(v){ return LENGTHS[len].ok(v.mins); });
      ul.innerHTML = '';
      if (!fit.length){ ul.innerHTML = '<li class="msoon">Nothing that length yet.</li>'; }
      fit.slice(0, shown).forEach(function(v){
        var li = document.createElement('li'); li.className = 'mvid';
        var thumb = v.sample ? '<span class="msample" aria-hidden="true"></span>' : '<img src="https://i.ytimg.com/vi/' + v.id + '/mqdefault.jpg" alt="" loading="lazy">';
        li.innerHTML = '<button type="button" class="mthumb" aria-label="Play ' + esc(v.title) + '">' + thumb + '<span class="mplay" aria-hidden="true">\u25B6</span>' + (v.mins ? '<span class="mlen" aria-hidden="true">' + v.mins + ' min</span>' : '') + '</button>' +
          '<div class="mvmeta"><span class="mvtext"><strong>' + esc(v.title) + '</strong><span>' + esc(v.by) + (v.mins ? '<span class="sr-only">, ' + v.mins + ' minutes</span>' : '') + '</span>' + (v.sample ? '' : '<a class="mchan" href="' + esc(v.channel || ('https://www.youtube.com/watch?v=' + v.id)) + '" target="_blank" rel="noopener">' + (v.channel ? 'Visit channel' : 'Watch on YouTube') + '<span class="sr-only"> (opens YouTube)</span></a>') + '</span><button type="button" class="feye" aria-label="Hide ' + esc(v.title) + '">' + LIDS + '</button></div>';
        li.querySelector('.mthumb').addEventListener('click', function(){
          if (v.sample) return;
          // Opened from the home screen: YouTube asks for a sign-in inside installed apps, so open the video in YouTube instead.
          if (homeScreen()){ window.open('https://www.youtube.com/watch?v=' + v.id, '_blank', 'noopener'); return; }
          li.classList.add('playing');
          var org = encodeURIComponent(location.origin);
          this.outerHTML = '<div class="mframe"><iframe src="https://www.youtube.com/embed/' + v.id + '?rel=0&playsinline=1&enablejsapi=1&origin=' + org + '&widget_referrer=' + org + '" title="' + esc(v.title) + '" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>';
        });
        li.querySelector('.feye').addEventListener('click', function(){ hide('v:' + v.id); all = all.filter(function(x){ return x !== v; }); if (!all.length) drawSheet(k); else { vb.querySelector('.mvcount').textContent = '(' + all.length + ')'; list(); } });
        ul.appendChild(li);
      });
      var left = fit.length - shown;
      more.hidden = left <= 0;
      more.textContent = 'Show more (' + Math.max(left, 0) + ')';
    }
    list();
  }

  // ---------- sound helpers ----------
  var ctx = null;
  function ac(){ try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); } catch (e){} return ctx; }
  function noiseBuf(sec, color){
    var c = ac(), n = Math.floor(c.sampleRate * sec), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0), last = 0;
    for (var i = 0; i < n; i++){ var w = Math.random() * 2 - 1; if (color === 'brown'){ last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
    return b;
  }
  function burst(freq, q, len, vol, when){
    var c = ac(); if (!c) return; var t = c.currentTime + (when || 0);
    var s = c.createBufferSource(); s.buffer = noiseBuf(len, 'white');
    var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    var g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t + len + 0.02);
  }
  function bell(){
    var c = ac(); if (!c) return; var t = c.currentTime;
    [528, 792, 1056].forEach(function(fr, i){ var o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = fr;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18 / (i + 1), t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 4.1); });
  }
  function pop(){ burst(1400 + Math.random() * 400, 1.2, 0.05, 0.35); var c = ac(); if (!c) return; var t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.07); g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.08); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.09); }
  function buzz(ms){ try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e){} }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function choices(el, opts, onPick, label){
    var w = document.createElement('div'); w.className = 'wchips'; w.setAttribute('role', 'group'); if (label) w.setAttribute('aria-label', label);
    opts.forEach(function(o, i){ var b = document.createElement('button'); b.type = 'button'; b.className = 'wchip'; b.textContent = o; b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function(){ w.querySelectorAll('.wchip').forEach(function(x){ x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); onPick(i); }); w.appendChild(b); });
    el.appendChild(w); return w;
  }
  function patch(text){ var b = document.createElement('button'); b.type = 'button'; b.className = 'startbtn mgo'; b.textContent = text; return b; }

  // ---------- tools ----------
  var TOOLS = {};

  TOOLS.breath = function(el){
    var PATTERNS = [ { name:'Calm', steps:[['Breathe in',4],['Breathe out',6]] },
                     { name:'Box', steps:[['Breathe in',4],['Hold',4],['Breathe out',4],['Hold',4]] },
                     { name:'4-7-8', steps:[['Breathe in',4],['Hold',7],['Breathe out',8]] } ];
    var p = 0, timer = null, running = false;
    choices(el, PATTERNS.map(function(x){ return x.name; }), function(i){ p = i; if (running){ stop(); start(); } }, 'Breathing pattern');
    var stage = document.createElement('div'); stage.className = 'mbreath';
    stage.innerHTML = '<div class="mcircle" id="m-circle"></div><p class="mcue" id="m-cue" aria-live="polite">Ready when you are.</p><p class="mcount" id="m-count"></p>';
    el.appendChild(stage);
    var go = patch('Start'); el.appendChild(go);
    var circle = stage.querySelector('#m-circle'), cue = stage.querySelector('#m-cue'), count = stage.querySelector('#m-count');
    function run(i){
      var st = PATTERNS[p].steps[i % PATTERNS[p].steps.length], name = st[0], secs = st[1], left = secs;
      cue.textContent = name; count.textContent = left;
      if (!reduce){ circle.style.transitionDuration = secs + 's'; circle.style.transform = name === 'Breathe in' ? 'scale(1)' : (name === 'Breathe out' ? 'scale(0.45)' : circle.style.transform); }
      timer = setInterval(function(){ left--; if (left > 0) count.textContent = left; else { clearInterval(timer); run(i + 1); } }, 1000);
    }
    function start(){ running = true; go.textContent = 'Stop'; circle.style.transform = 'scale(0.45)'; setTimeout(function(){ if (running) run(0); }, 60); }
    function stop(){ running = false; clearInterval(timer); go.textContent = 'Start'; cue.textContent = 'Ready when you are.'; count.textContent = ''; circle.style.transitionDuration = '1s'; circle.style.transform = 'scale(0.6)'; }
    go.addEventListener('click', function(){ running ? stop() : start(); });
    return stop;
  };

  TOOLS.ground = function(el){
    if ($('open-pulse')){ var go = patch('The 5, 4, 3, 2, 1'); el.appendChild(go);
      go.addEventListener('click', function(){ closeSheet(); $('open-pulse').click(); }); }
    var steps = ['Feel your feet on the floor. Press them down a little.', 'Notice where your body touches the chair, the bed or the ground.', 'Drop your shoulders. Unclench your jaw.', 'Take one slow breath, and notice the air going in and out.', 'Name one thing you can see that’s a color you like.'];
    var i = 0, card = document.createElement('div'); card.className = 'mcard';
    card.innerHTML = '<h3 class="mh3">A quick body check</h3><p class="mstep" aria-live="polite">' + steps[0] + '</p>';
    var nx = document.createElement('button'); nx.type = 'button'; nx.className = 'linkbtn'; nx.textContent = 'Next';
    nx.addEventListener('click', function(){ i = (i + 1) % steps.length; card.querySelector('.mstep').textContent = steps[i]; });
    card.appendChild(nx); el.appendChild(card);
  };

  TOOLS.meditate = function(el){
    var mins = [1, 3, 5, 10], m = 0, timer = null, prompts = null, left = 0;
    var LINES = ['Let your breath be whatever it is.', 'If a thought shows up, notice it, and come back to the breath.', 'Nothing to fix. Just this breath.', 'Notice the sounds around you, near and far.', 'Soften your face, your shoulders, your hands.', 'If you drift, that’s normal. Come back whenever you notice.'];
    choices(el, mins.map(function(x){ return x + ' min'; }), function(i){ m = i; }, 'How long');
    var st = document.createElement('div'); st.className = 'mmed'; st.innerHTML = '<p class="mtime" id="m-time"></p><p class="mstep" id="m-line" aria-live="polite">Get comfortable. Close your eyes if you’d like.</p>'; el.appendChild(st);
    var go = patch('Begin'); el.appendChild(go);
    function fmt(s){ return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
    function stop(done){ clearInterval(timer); clearInterval(prompts); timer = null; go.textContent = 'Begin'; st.querySelector('#m-time').textContent = done ? 'Done' : ''; if (done){ bell(); st.querySelector('#m-line').textContent = 'Take your time coming back.'; } }
    go.addEventListener('click', function(){
      if (timer){ stop(false); return; }
      left = mins[m] * 60; bell(); go.textContent = 'End early'; st.querySelector('#m-time').textContent = fmt(left);
      var li = 0; st.querySelector('#m-line').textContent = LINES[0];
      timer = setInterval(function(){ left--; st.querySelector('#m-time').textContent = fmt(left); if (left <= 0) stop(true); }, 1000);
      prompts = setInterval(function(){ li = (li + 1) % LINES.length; st.querySelector('#m-line').textContent = LINES[li]; }, 40000);
    });
    return function(){ stop(false); };
  };

  TOOLS.sounds = function(el){
    var KINDS = ['Rain', 'Ocean', 'Fire', 'Soft noise'], playing = null, nodes = [], vol = 0.5;
    var w = document.createElement('div'); w.className = 'wchips'; w.setAttribute('role', 'group'); w.setAttribute('aria-label', 'Sounds');
    var master = null;
    function stopAll(){ nodes.forEach(function(n){ try { n.stop(); } catch (e){} try { n.disconnect(); } catch (e){} }); nodes = []; playing = null; w.querySelectorAll('.wchip').forEach(function(b){ b.setAttribute('aria-pressed', 'false'); }); }
    function play(kind){
      var c = ac(); if (!c) return; stopAll(); playing = kind;
      master = c.createGain(); master.gain.value = vol; master.connect(c.destination); nodes.push(master);
      function loop(color, type, freq, q, gain){ var s = c.createBufferSource(); s.buffer = noiseBuf(4, color); s.loop = true; var f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; if (q) f.Q.value = q; var g = c.createGain(); g.gain.value = gain; s.connect(f); f.connect(g); g.connect(master); s.start(); nodes.push(s, f, g); return g; }
      if (kind === 'Rain'){ loop('white', 'highpass', 900, 0, 0.35); loop('brown', 'lowpass', 600, 0, 0.5);
        var drops = setInterval(function(){ if (playing !== 'Rain') return clearInterval(drops); burst(2500 + Math.random() * 3000, 4, 0.03, 0.06 * vol); }, 90); nodes.push({ stop:function(){ clearInterval(drops); }, disconnect:function(){} }); }
      if (kind === 'Ocean'){ var g = loop('brown', 'lowpass', 500, 0, 0.9); var lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.09; lg.gain.value = 0.55; lfo.connect(lg); lg.connect(g.gain); lfo.start(); nodes.push(lfo, lg); }
      if (kind === 'Fire'){ loop('brown', 'lowpass', 300, 0, 0.7);
        var cr = setInterval(function(){ if (playing !== 'Fire') return clearInterval(cr); if (Math.random() < 0.6) burst(1500 + Math.random() * 2500, 2, 0.02 + Math.random() * 0.04, (0.1 + Math.random() * 0.25) * vol); }, 120); nodes.push({ stop:function(){ clearInterval(cr); }, disconnect:function(){} }); }
      if (kind === 'Soft noise') loop('brown', 'lowpass', 1200, 0, 0.8);
    }
    KINDS.forEach(function(k){ var b = document.createElement('button'); b.type = 'button'; b.className = 'wchip'; b.textContent = k; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function(){ if (playing === k){ stopAll(); return; } play(k); b.setAttribute('aria-pressed', 'true'); }); w.appendChild(b); });
    el.appendChild(w);
    var lab = document.createElement('label'); lab.className = 'mvol'; lab.innerHTML = '<span>Volume</span><input type="range" min="0" max="100" value="50">';
    lab.querySelector('input').addEventListener('input', function(){ vol = this.value / 100; if (master) master.gain.value = vol; });
    el.appendChild(lab);
    var n = document.createElement('p'); n.className = 'hintline'; n.textContent = 'Tap a sound to play it, and tap it again to stop.'; el.appendChild(n);
    return stopAll;
  };

  TOOLS.dump = function(el){
    var mins = [2, 5, 10], m = 0, timer = null, left = 0;
    choices(el, mins.map(function(x){ return x + ' min'; }), function(i){ m = i; }, 'How long');
    var ta = document.createElement('textarea'); ta.className = 'mdump'; ta.rows = 7; ta.setAttribute('aria-label', 'Brain dump'); ta.placeholder = 'Everything in your head. Spelling doesn’t count.'; el.appendChild(ta);
    var info = document.createElement('p'); info.className = 'mtime'; info.setAttribute('aria-live', 'polite'); el.appendChild(info);
    var go = patch('Start the timer'); el.appendChild(go);
    var row = document.createElement('div'); row.className = 'mrow2';
    row.innerHTML = '<button type="button" class="linkbtn" id="m-letgo">Let it go</button><button type="button" class="linkbtn" id="m-keep">Keep it in my Journal</button>';
    el.appendChild(row);
    function fmt(s){ return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
    go.addEventListener('click', function(){
      if (timer){ clearInterval(timer); timer = null; go.textContent = 'Start the timer'; info.textContent = ''; return; }
      left = mins[m] * 60; go.textContent = 'Stop the timer'; info.textContent = fmt(left); ta.focus();
      timer = setInterval(function(){ left--; info.textContent = fmt(left); if (left <= 0){ clearInterval(timer); timer = null; go.textContent = 'Start the timer'; info.textContent = 'Time. Keep going if you’d like.'; bell(); } }, 1000);
    });
    row.querySelector('#m-letgo').addEventListener('click', function(){ if (!ta.value.trim()) return; ta.classList.add('mfade'); setTimeout(function(){ ta.value = ''; ta.classList.remove('mfade'); info.textContent = 'Let go.'; }, 700); });
    row.querySelector('#m-keep').addEventListener('click', function(){
      var t = ta.value.trim(); if (!t) return;
      if (document.body.classList.contains('demo')){ info.textContent = 'In the app, this saves to a private Journal.'; return; }
      if (!window.OptionalAccount || !OptionalAccount.addEntry){ info.textContent = 'Couldn’t save right now.'; return; }
      info.textContent = 'Saving…';
      OptionalAccount.addEntry('journal', { text: t }).then(function(){ ta.value = ''; info.textContent = 'Saved to your Journal. Only you can read it.'; }, function(){ info.textContent = 'Uh-oh, that didn’t save. Give it a moment and try again.'; });
    });
    return function(){ clearInterval(timer); };
  };

  TOOLS.affirm = function(el){
    // Placeholder lines for Astride to rewrite in her own voice.
    var LINES = ['This feeling is real, and it will pass.', 'I’m allowed to take this one moment at a time.', 'I don’t have to have it all figured out today.', 'Noticing is already a choice.', 'I can be gentle with myself right now.', 'I’ve gotten through hard moments before.', 'What I feel makes sense, even if I don’t act on it.', 'I get to choose what’s next.'];
    var i = Math.floor(Math.random() * LINES.length);
    var card = document.createElement('div'); card.className = 'maff'; card.innerHTML = '<p aria-live="polite">' + LINES[i] + '</p>'; el.appendChild(card);
    var nx = patch('Another one'); el.appendChild(nx);
    nx.addEventListener('click', function(){ i = (i + 1) % LINES.length; card.querySelector('p').textContent = LINES[i]; });
  };

  TOOLS.art = function(el){
    var PROMPTS = ['Draw how today feels, using only shapes.', 'Scribble as fast as you can for ten seconds, then find a picture in it.', 'Draw a place where you feel safe.', 'Pick one color for how you feel, and fill the page with it.', 'Draw the weather inside you right now.'];
    var pr = document.createElement('p'); pr.className = 'mstep'; pr.textContent = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]; el.appendChild(pr);
    var COLORS = ['#34302A', '#A02020', '#5E6B44', '#2C6CA3', '#C9842F', '#B04A7A'], color = COLORS[0];
    var w = document.createElement('div'); w.className = 'mswatches'; w.setAttribute('role', 'group'); w.setAttribute('aria-label', 'Colors');
    COLORS.forEach(function(c, idx){ var b = document.createElement('button'); b.type = 'button'; b.className = 'mswatch'; b.style.background = c; b.setAttribute('aria-label', 'Color ' + (idx + 1)); b.setAttribute('aria-pressed', idx === 0 ? 'true' : 'false');
      b.addEventListener('click', function(){ color = c; w.querySelectorAll('.mswatch').forEach(function(x){ x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); }); w.appendChild(b); });
    el.appendChild(w);
    var cv = document.createElement('canvas'); cv.className = 'mcanvas'; cv.setAttribute('aria-label', 'Drawing space'); el.appendChild(cv);
    var g = cv.getContext('2d'), drawing = false;
    function size(){ var r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1; cv.width = r.width * dpr; cv.height = r.height * dpr; g.scale(dpr, dpr); g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 5; }
    setTimeout(size, 30);
    function pt(e){ var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    cv.addEventListener('pointerdown', function(e){ drawing = true; cv.setPointerCapture(e.pointerId); var p = pt(e); g.strokeStyle = color; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + 0.1, p[1]); g.stroke(); });
    cv.addEventListener('pointermove', function(e){ if (!drawing) return; var p = pt(e); g.lineTo(p[0], p[1]); g.stroke(); });
    cv.addEventListener('pointerup', function(){ drawing = false; });
    var row = document.createElement('div'); row.className = 'mrow2';
    row.innerHTML = '<button type="button" class="linkbtn" id="m-newprompt">New idea</button><button type="button" class="linkbtn" id="m-clear">Start over</button>';
    el.appendChild(row);
    row.querySelector('#m-newprompt').addEventListener('click', function(){ pr.textContent = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]; });
    row.querySelector('#m-clear').addEventListener('click', function(){ g.clearRect(0, 0, cv.width, cv.height); });
  };

  TOOLS.collage = function(el){
    var PROMPTS = ['Find five things around you that are the same color, and lay them out together.', 'Cut or tear words from an old magazine or mail that describe how you’d like to feel.', 'Make a little collage of things that make you laugh.', 'Gather photos from your phone that feel calm, and look through them slowly.', 'Arrange a few small objects into a pattern you like, then change it.', 'Put together images of a place you’d like to go someday.'];
    var i = Math.floor(Math.random() * PROMPTS.length);
    var card = document.createElement('div'); card.className = 'maff'; card.innerHTML = '<p aria-live="polite">' + PROMPTS[i] + '</p>'; el.appendChild(card);
    var nx = patch('Another idea'); el.appendChild(nx);
    nx.addEventListener('click', function(){ i = (i + 1) % PROMPTS.length; card.querySelector('p').textContent = PROMPTS[i]; });
  };

  TOOLS.music = function(el){
    var PROMPTS = ['Put on one song that matches exactly how you feel. Just listen.', 'Now pick one song for how you’d like to feel next.', 'Make a short playlist that goes from where you are to where you’d like to be.', 'Hum, sing or tap a rhythm, even quietly.', 'Listen to a song you loved years ago, and notice what comes up.'];
    var i = 0, card = document.createElement('div'); card.className = 'maff'; card.innerHTML = '<p aria-live="polite">' + PROMPTS[0] + '</p>'; el.appendChild(card);
    var nx = patch('Another idea'); el.appendChild(nx);
    nx.addEventListener('click', function(){ i = (i + 1) % PROMPTS.length; card.querySelector('p').textContent = PROMPTS[i]; });
  };

  // ---------- Oddly Satisfying: do it yourself ----------
  TOOLS.odd = function(el){
    var tabs = ['Bubble wrap', 'Sand', 'Squish', 'Crumple'], area = document.createElement('div'), cleanup = null;
    choices(el, tabs, function(i){ show(i); }, 'Pick one');
    area.className = 'modd'; el.appendChild(area);
    function show(i){ if (cleanup){ cleanup(); cleanup = null; } area.innerHTML = ''; cleanup = [bubbles, sand, squish, crumple][i](area) || null; }
    show(0);
    return function(){ if (cleanup) cleanup(); };
  };
  function bubbles(area){
    var grid = document.createElement('div'); grid.className = 'mwrap';
    function fill(){ grid.innerHTML = ''; for (var i = 0; i < 30; i++){ var b = document.createElement('button'); b.type = 'button'; b.className = 'mbub'; b.setAttribute('aria-label', 'Bubble');
      b.addEventListener('pointerdown', function(){ var me = this; if (me.classList.contains('popped')) return; me.classList.add('press'); setTimeout(function(){ me.classList.remove('press'); me.classList.add('popped'); me.setAttribute('aria-label', 'Popped'); pop(); buzz(25); }, 90); });
      b.addEventListener('click', function(e){ if (e.detail === 0 && !this.classList.contains('popped')){ this.classList.add('popped'); pop(); } });
      grid.appendChild(b); } }
    fill(); area.appendChild(grid);
    var again = document.createElement('button'); again.type = 'button'; again.className = 'linkbtn'; again.textContent = 'Fresh sheet'; again.addEventListener('click', fill); area.appendChild(again);
  }
  function sand(area){
    var cv = document.createElement('canvas'); cv.className = 'msand'; cv.setAttribute('aria-label', 'Kinetic sand. Drag down across it, or tap, to slice.'); area.appendChild(cv);
    var hint = document.createElement('p'); hint.className = 'hintline'; hint.textContent = 'Drag down across the sand to slice it.'; area.appendChild(hint);
    var g = cv.getContext('2d'), W = 0, H = 0, edge = 0, slices = [], grains = [], raf = null, dpr = window.devicePixelRatio || 1;
    var LAYERS = ['#E9A8B8', '#F2C98A', '#9FCBB4', '#A9B8E6', '#E7B3E0'];
    function reset(){ var r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); edge = W - 20; slices = []; grains = []; draw(); }
    function block(x0, x1, ox, oy, rot){
      g.save(); g.translate(ox, oy); g.rotate(rot || 0);
      var top = H * 0.25, h = H * 0.6, lh = h / LAYERS.length;
      LAYERS.forEach(function(c, i){ g.fillStyle = c; g.fillRect(x0, top + i * lh, x1 - x0, lh + 0.5); });
      g.fillStyle = 'rgba(0,0,0,0.04)'; for (var k = 0; k < (x1 - x0) * 2; k++) g.fillRect(x0 + Math.random() * (x1 - x0), top + Math.random() * h, 1, 1);
      g.restore();
    }
    function draw(){
      g.clearRect(0, 0, W, H);
      g.fillStyle = 'rgba(52,48,42,0.12)'; g.fillRect(16, H * 0.85, W - 32, 4);
      block(20, edge, 0, 0, 0);
      slices.forEach(function(s){ block(s.x0, s.x1, s.dx, s.dy, s.rot); });
      grains.forEach(function(p){ g.fillStyle = p.c; g.fillRect(p.x, p.y, 2.5, 2.5); });
    }
    function tick(){
      var alive = false;
      slices.forEach(function(s){ if (s.t < 1){ s.t += 0.04; s.dx += 1.6; s.rot = Math.min(0.35, s.rot + 0.02); s.dy = Math.min(H * 0.15, s.dy + 2); alive = true; } });
      grains.forEach(function(p){ p.vy += 0.25; p.x += p.vx; p.y += p.vy; if (p.y < H * 0.85) alive = true; });
      grains = grains.filter(function(p){ return p.y < H * 0.86; });
      slices = slices.filter(function(s){ return s.dx < W; });
      draw(); raf = alive ? requestAnimationFrame(tick) : null;
    }
    function cut(){
      if (edge < 60){ edge = W - 20; draw(); return; }
      var w = 14 + Math.random() * 10, x0 = edge - w;
      slices.push({ x0:x0, x1:edge, dx:0, dy:0, rot:0, t:0 });
      for (var i = 0; i < 40; i++) grains.push({ x:x0 + Math.random() * w, y:H * 0.25 + Math.random() * H * 0.6, vx:(Math.random() - 0.3) * 1.5, vy:Math.random() * -1, c:LAYERS[Math.floor(Math.random() * LAYERS.length)] });
      edge = x0;
      for (var k = 0; k < 6; k++) burst(2500 + Math.random() * 2500, 1.5, 0.03 + Math.random() * 0.03, 0.12, k * 0.025);
      buzz(15);
      if (!raf) raf = requestAnimationFrame(tick);
    }
    var sy = null;
    cv.addEventListener('pointerdown', function(e){ sy = e.clientY; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointerup', function(e){ if (sy !== null && (e.clientY - sy > 25 || Math.abs(e.clientY - sy) < 8)) cut(); sy = null; });
    cv.tabIndex = 0; cv.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); cut(); } });
    setTimeout(reset, 30);
    var again = document.createElement('button'); again.type = 'button'; again.className = 'linkbtn'; again.textContent = 'New block'; again.addEventListener('click', reset); area.appendChild(again);
    return function(){ if (raf) cancelAnimationFrame(raf); };
  }
  function squish(area){
    var b = document.createElement('button'); b.type = 'button'; b.className = 'mblob'; b.setAttribute('aria-label', 'Squishy blob. Press and hold to squish.');
    b.innerHTML = '<span class="mblobin"></span>'; area.appendChild(b);
    var hint = document.createElement('p'); hint.className = 'hintline'; hint.textContent = 'Press and hold to squish it. Let go and it bounces back.'; area.appendChild(hint);
    var held = null;
    function squelch(){ var c = ac(); if (!c) return; var t = c.currentTime, s = c.createBufferSource(); s.buffer = noiseBuf(0.3, 'brown'); var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(200, t + 0.25); var gg = c.createGain(); gg.gain.setValueAtTime(0.9, t); gg.gain.exponentialRampToValueAtTime(0.001, t + 0.3); s.connect(f); f.connect(gg); gg.connect(c.destination); s.start(t); }
    b.addEventListener('pointerdown', function(e){ e.preventDefault(); b.classList.add('down'); squelch(); buzz(30); });
    function up(){ if (!b.classList.contains('down')) return; b.classList.remove('down'); b.classList.add('boing'); setTimeout(function(){ b.classList.remove('boing'); }, 600); }
    b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
    b.addEventListener('click', function(e){ if (e.detail === 0){ b.classList.add('down'); squelch(); setTimeout(up, 400); } });
  }
  function crumple(area){
    var NS = 'http://www.w3.org/2000/svg', box = document.createElement('div'); box.className = 'mpaper';
    box.innerHTML = '<svg viewBox="0 0 200 200" aria-hidden="true"><polygon id="m-sheet" points="20,20 100,20 180,20 180,100 180,180 100,180 20,180 20,100" fill="#FAF4E8" stroke="#C9BBA2" stroke-width="1.5"/><g id="m-creases" stroke="rgba(120,100,80,0.45)" stroke-width="1" fill="none"></g></svg>';
    area.appendChild(box);
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'startbtn mgo'; btn.textContent = 'Hold to crumple'; area.appendChild(btn);
    var again = document.createElement('button'); again.type = 'button'; again.className = 'linkbtn'; again.textContent = 'Fresh sheet'; area.appendChild(again);
    var BASE = [[20,20],[100,20],[180,20],[180,100],[180,180],[100,180],[20,180],[20,100]], pts = BASE.map(function(p){ return p.slice(); }), level = 0, timer = null;
    var sheet = box.querySelector('#m-sheet'), creases = box.querySelector('#m-creases');
    function drawPts(){ sheet.setAttribute('points', pts.map(function(p){ return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ')); }
    function step(){
      if (level >= 14) return;
      level++;
      pts = pts.map(function(p){ var dx = 100 - p[0], dy = 100 - p[1]; return [p[0] + dx * 0.09 + (Math.random() - 0.5) * 6, p[1] + dy * 0.09 + (Math.random() - 0.5) * 6]; });
      drawPts();
      var l = document.createElementNS(NS, 'path'), r = 70 - level * 3;
      l.setAttribute('d', 'M' + (100 + (Math.random() - 0.5) * r * 2) + ',' + (100 + (Math.random() - 0.5) * r * 2) + ' L' + (100 + (Math.random() - 0.5) * r * 2) + ',' + (100 + (Math.random() - 0.5) * r * 2));
      creases.appendChild(l);
      box.style.transform = 'rotate(' + (Math.random() * 8 - 4) + 'deg)';
      for (var k = 0; k < 4; k++) burst(3000 + Math.random() * 3000, 1, 0.02 + Math.random() * 0.03, 0.18, k * 0.03);
      buzz(10);
    }
    function start(e){ if (e) e.preventDefault(); step(); clearInterval(timer); timer = setInterval(step, 160); }
    function end(){ clearInterval(timer); timer = null; }
    btn.addEventListener('pointerdown', start); btn.addEventListener('pointerup', end); btn.addEventListener('pointerleave', end); btn.addEventListener('pointercancel', end);
    btn.addEventListener('click', function(e){ if (e.detail === 0){ step(); step(); step(); } });
    again.addEventListener('click', function(){ level = 0; pts = BASE.map(function(p){ return p.slice(); }); drawPts(); creases.innerHTML = ''; box.style.transform = ''; });
    return end;
  }

  // Preview only: fill an activity with pretend cards so the layout can be judged.
  window.OptionalMindSample = function(key, n){ var a = act(key); var L = [5, 8, 12, 15, 20, 25, 40, 3, 10, 30, 45, 7]; for (var i = 0; i < n; i++) a.videos.push({ id:'sample' + i, title:'Sample video ' + (i + 1), by:'Creator name', mins:L[i % L.length], sample:true }); };
  var started = false;
  window.OptionalMind = { show:function(){ if (!started){ started = true; drawList(); } } };
})();
