// =========================================================
// OPTIONAL — the "[nickname] & [Friend]" page
// Mood stickers, the Bestie / Journal / Cue Alarm tabs, pictures,
// the hide feature (closed eyes) and the page lock.
// Journal entries and check-ins are locked on the phone before they're saved.
// =========================================================
(function(){
  function $(id){ return document.getElementById(id); }
  function app(){ return window.OptionalApp; }

  /* ---------- pictures: yours (avatars.js) and your Friend's (friends.js) ---------- */
  var SETS = { me: window.OPTIONAL_AVATARS || {}, friend: window.OPTIONAL_FRIENDS || {} };
  var chosen = { me: 'curly', friend: 'elephant' };
  function paint(){
    if (window.OptionalInApp) OptionalInApp.setAvatar(chosen.me);
    var f = document.querySelectorAll('.fr-slot'); for (var j = 0; j < f.length; j++) f[j].innerHTML = (SETS.friend[chosen.friend] || SETS.friend.elephant).svg;
  }
  var pickScrim = $('pick-scrim'), pickGrid = $('pick-grid'), lastOpener = null;
  function openSheet(sc){ lastOpener = document.activeElement; sc.hidden = false; document.body.style.overflow = 'hidden'; var h = sc.querySelector('h2'); if (h) h.focus(); }
  function closeSheet(sc){ sc.hidden = true; document.body.style.overflow = ''; if (lastOpener && lastOpener.focus) lastOpener.focus(); }
  function openPicker(which){
    $('pick-title').textContent = which === 'me' ? 'Pick your picture' : 'Pick a look for ' + ((document.querySelector('.who') || {}).textContent || 'Bestie');
    $('pick-note').textContent = which === 'me' ? 'Adding your own photo is coming later. It will be kept private, like your journal.' : '';
    pickGrid.innerHTML = '';
    var set = SETS[which];
    Object.keys(set).forEach(function(k){
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'avopt'; b.setAttribute('aria-label', set[k].name);
      b.setAttribute('aria-pressed', chosen[which] === k ? 'true' : 'false');
      b.innerHTML = set[k].svg;
      b.addEventListener('click', function(){
        var before = chosen[which];
        chosen[which] = k; paint();
        var all = pickGrid.querySelectorAll('.avopt'); for (var i = 0; i < all.length; i++) all[i].setAttribute('aria-pressed', all[i] === b ? 'true' : 'false');
        var saving = which === 'me' ? app().saveAvatar(k) : app().updateSettings({ friendLook: k });
        $('pick-note').textContent = 'Saving\u2026';
        saving.then(function(){ $('pick-note').textContent = 'Saved.'; }, function(){ chosen[which] = before; paint(); $('pick-note').textContent = 'That didn\u2019t save. Try again.'; });
      });
      pickGrid.appendChild(b);
    });
    openSheet(pickScrim);
  }
  paint();
  pickScrim.querySelector('.closer').addEventListener('click', function(){ closeSheet(pickScrim); });
  pickScrim.addEventListener('click', function(e){ if (e.target === pickScrim) closeSheet(pickScrim); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !pickScrim.hidden) closeSheet(pickScrim); });
  // hold down your picture (on any page) to change it
  function holdable(btn){
    if (!btn) return;
    var timer = null, held = false;
    btn.addEventListener('pointerdown', function(){ held = false; timer = setTimeout(function(){ held = true; openPicker('me'); }, 550); });
    ['pointerup','pointerleave','pointercancel'].forEach(function(ev){ btn.addEventListener(ev, function(){ clearTimeout(timer); }); });
    btn.addEventListener('contextmenu', function(e){ e.preventDefault(); });
    btn.addEventListener('click', function(e){ if (held) { e.stopImmediatePropagation(); e.preventDefault(); held = false; } }, true);
  }
  holdable($('open-dash')); holdable($('dash-me'));
  $('dash-me').addEventListener('click', function(){ openPicker('me'); });
  $('friend-pic').addEventListener('click', function(){ openPicker('friend'); });

  /* ---------- notebook tabs on the big box ---------- */
  var tabs = ['talk','journal','cue'];
  function selectTab(name, focus){
    tabs.forEach(function(n){
      var tb = document.getElementById('tab-' + n), pn = document.getElementById('panel-' + n), on = n === name;
      tb.setAttribute('aria-selected', on ? 'true' : 'false'); tb.tabIndex = on ? 0 : -1; pn.hidden = !on;
      if (on && focus) tb.focus();
    });
    if (name === 'talk') setTimeout(maybeNote, 30);
  }
  tabs.forEach(function(n, i){
    var tb = document.getElementById('tab-' + n);
    tb.addEventListener('click', function(){ selectTab(n); });
    tb.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight') { e.preventDefault(); selectTab(tabs[(i + 1) % tabs.length], true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); selectTab(tabs[(i + tabs.length - 1) % tabs.length], true); }
    });
  });

  /* ---------- Shared: torn paper confirm + Undo note ---------- */
  var cScrim = document.getElementById('confirm-scrim'), cYes = document.getElementById('confirm-yes'), cNo = document.getElementById('confirm-no'), cBack = null, cDo = null;
  function confirmIt(title, sub, yesLabel, doIt){
    cBack = document.activeElement; cDo = doIt;
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-sub').textContent = sub;
    cYes.textContent = yesLabel; cScrim.hidden = false; cYes.focus();
  }
  function closeConfirm(back){ cScrim.hidden = true; if (back && cBack && cBack.offsetParent) cBack.focus(); }
  cYes.addEventListener('click', function(){ closeConfirm(false); if (cDo) cDo(); });
  cNo.addEventListener('click', function(){ closeConfirm(true); });
  cScrim.addEventListener('click', function(e){ if (e.target === cScrim) closeConfirm(true); });
  cScrim.addEventListener('keydown', function(e){
    if (e.key === 'Escape') { e.stopPropagation(); closeConfirm(true); return; }
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === cYes) { e.preventDefault(); cNo.focus(); }
    else if (!e.shiftKey && document.activeElement === cNo) { e.preventDefault(); cYes.focus(); }
  });
  var uToast = document.getElementById('undo-toast'), uTimer = null, uFn = null;
  function undoNote(msg, fn){
    document.getElementById('undo-msg').textContent = msg; uFn = fn || null; document.getElementById('undo-btn').hidden = !fn; uToast.hidden = false;
    clearTimeout(uTimer); uTimer = setTimeout(function(){ uToast.hidden = true; }, 7000);
  }
  document.getElementById('undo-btn').addEventListener('click', function(){ uToast.hidden = true; clearTimeout(uTimer); if (uFn) uFn(); });
  uToast.addEventListener('mouseenter', function(){ clearTimeout(uTimer); });
  uToast.addEventListener('mouseleave', function(){ uTimer = setTimeout(function(){ uToast.hidden = true; }, 7000); });
  function stamp(d){ return d.toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'}) + ', ' + d.toLocaleTimeString(undefined, {hour:'numeric', minute:'2-digit'}); }
  var Acc = window.OptionalAccount;

  /* ---------- Journal (saved to Supabase, locked on the phone first) ---------- */
  var jentries = document.getElementById('jentries'), journal = [];
  function drawJournal(){
    jentries.innerHTML = '';
    journal.forEach(function(en, i){
      var p = document.createElement('div'); p.className = 'jentry';
      var w = document.createElement('span'); w.className = 'when'; w.textContent = stamp(new Date(en.at));
      var tx = document.createElement('p'); tx.style.margin = '0'; tx.textContent = en.value.text;
      var er = document.createElement('button'); er.type = 'button'; er.className = 'erasebtn'; er.textContent = 'Erase';
      er.setAttribute('aria-label', 'Erase the entry from ' + w.textContent);
      er.addEventListener('click', function(){
        confirmIt('Erase this entry?', 'It will be gone for good once the Undo note closes.', 'Erase', function(){
          var gone = journal.splice(i, 1)[0]; drawJournal(); document.getElementById('jnote').focus();
          var undone = false;
          undoNote('Entry erased.', function(){ undone = true; journal.splice(i, 0, gone); drawJournal(); });
          setTimeout(function(){ if (!undone) Acc.deleteEntry(gone.id).catch(function(){ journal.splice(i, 0, gone); drawJournal(); undoNote('That didn\u2019t erase. Try again.'); }); }, 7600);
        });
      });
      p.appendChild(w); p.appendChild(tx); p.appendChild(er); jentries.appendChild(p);
    });
  }
  async function addJournal(text){
    var saved = await Acc.addEntry('journal', { text: text });
    journal.unshift({ id: saved.id, at: saved.created_at || new Date().toISOString(), value: { text: text } }); drawJournal();
  }
  document.getElementById('jsave').addEventListener('click', function(){
    var box = document.getElementById('jnote'), txt = box.value.trim(), btn = this;
    if (!txt) { box.focus(); return; }
    btn.disabled = true;
    addJournal(txt).then(function(){ box.value = ''; }, function(){ undoNote('That didn\u2019t save. Try again.'); }).then(function(){ btn.disabled = false; });
  });

  /* ---------- Bestie: clear conversation ---------- */
  document.getElementById('clear-talk').addEventListener('click', function(){
    var th = document.getElementById('thread'), btn = this;
    confirmIt('Clear this conversation?', 'It will be gone for good once the Undo note closes.', 'Clear', function(){
      var saved = th.innerHTML;
      th.innerHTML = '<p class="outempty">Say hi, or pick a feeling above.</p>'; btn.hidden = true;
      document.getElementById('dash-input').focus();
      undoNote('Conversation cleared.', function(){ th.innerHTML = saved; btn.hidden = false; });
    });
  });

  /* ---------- Cue Alarm: clock the moment, as often as needed ---------- */
  var cueChips = document.getElementById('cue-chips'), cueTime = document.getElementById('cue-time');
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function nowTime(){ var d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  cueTime.value = nowTime();
  document.getElementById('tab-cue').addEventListener('click', function(){ if (!cueTime.dataset.touched) cueTime.value = nowTime(); });
  cueTime.addEventListener('input', function(){ cueTime.dataset.touched = '1'; });
  function wireChip(c){ c.addEventListener('click', function(){ this.setAttribute('aria-pressed', this.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); }); }
  Array.prototype.forEach.call(cueChips.querySelectorAll('.fchip'), wireChip);
  function addOwn(){
    var f = document.getElementById('cue-own'), v = f.value.trim(); if (!v) return;
    var c = document.createElement('button'); c.type = 'button'; c.className = 'fchip'; c.textContent = v; c.setAttribute('aria-pressed', 'true');
    wireChip(c); cueChips.appendChild(c); f.value = '';
  }
  document.getElementById('cue-add').addEventListener('click', addOwn);
  document.getElementById('cue-own').addEventListener('keydown', function(e){ if (e.key === 'Enter') { e.preventDefault(); addOwn(); } });
  var cues = [];
  function fmt(tm){ var p = tm.split(':'), h = +p[0], m = p[1]; return ((h % 12) || 12) + ':' + m + (h < 12 ? ' AM' : ' PM'); }
  function partOfDay(tm){ var h = +tm.split(':')[0]; return h < 5 ? 'late at night' : h < 12 ? 'in the morning' : h < 17 ? 'in the afternoon' : h < 21 ? 'in the evening' : 'late at night'; }
  function drawPatterns(){
    var out = document.getElementById('cue-pattern-text');
    var week = Date.now() - 7 * 864e5, recent = cues.filter(function(c){ return c.at >= week; });
    if (recent.length < 3) { out.textContent = 'Patterns show up after a few check-ins.'; return; }
    var feel = {}, when = {};
    recent.forEach(function(c){ (c.feels || []).forEach(function(f){ feel[f] = (feel[f] || 0) + 1; }); var p = partOfDay(c.time); when[p] = (when[p] || 0) + 1; });
    var top = Object.keys(feel).sort(function(a, b){ return feel[b] - feel[a]; });
    var topWhen = Object.keys(when).sort(function(a, b){ return when[b] - when[a]; })[0];
    var line = 'This week you clocked ' + recent.length + ' urges, mostly ' + topWhen + '.';
    if (top.length) line += ' ' + top[0] + ' came up ' + feel[top[0]] + (feel[top[0]] === 1 ? ' time' : ' times') + (top[1] ? ', then ' + top[1] + '.' : '.');
    out.textContent = line;
  }
  function drawCues(){
    var list = document.getElementById('cue-list'); list.innerHTML = '';
    document.getElementById('cue-saved').hidden = cues.length === 0;
    cues.forEach(function(c, i){
      var li = document.createElement('li');
      var ct = document.createElement('span'); ct.className = 'ct'; ct.textContent = new Date(c.at).toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'}) + ', ' + fmt(c.time);
      var cl = document.createElement('span'); cl.className = 'cl'; cl.textContent = [ (c.feels || []).join(', '), c.what ].filter(Boolean).join(' · ') || 'Clocked';
      var er = document.createElement('button'); er.type = 'button'; er.className = 'erasebtn'; er.textContent = 'Erase'; er.setAttribute('aria-label', 'Erase the check-in from ' + ct.textContent);
      er.addEventListener('click', function(){
        confirmIt('Erase this check-in?', 'It will be gone for good once the Undo note closes.', 'Erase', function(){
          var gone = cues.splice(i, 1)[0]; drawCues(); drawPatterns();
          document.getElementById('cue-set').focus();
          var undone = false;
          undoNote('Check-in erased.', function(){ undone = true; cues.splice(i, 0, gone); drawCues(); drawPatterns(); });
          setTimeout(function(){ if (!undone) Acc.deleteEntry(gone.id).catch(function(){ cues.splice(i, 0, gone); drawCues(); drawPatterns(); undoNote('That didn\u2019t erase. Try again.'); }); }, 7600);
        });
      });
      li.appendChild(ct); li.appendChild(cl); li.appendChild(er); list.appendChild(li);
    });
  }
  document.getElementById('cue-set').addEventListener('click', function(){
    var tm = cueTime.value, msg = document.getElementById('cue-msg');
    if (!tm) { msg.textContent = 'Pick a time first.'; cueTime.focus(); return; }
    var feels = Array.prototype.filter.call(cueChips.querySelectorAll('.fchip'), function(c){ return c.getAttribute('aria-pressed') === 'true'; }).map(function(c){ return c.textContent; });
    var what = document.getElementById('cue-what').value.trim();
    var entry = { time: tm, feels: feels, what: what }, btn = this; btn.disabled = true;
    Acc.addEntry('cue', entry).then(function(saved){
      cues.unshift({ id: saved.id, at: Date.parse(saved.created_at) || Date.now(), time: tm, feels: feels, what: what });
      drawCues(); drawPatterns();
      document.getElementById('cue-what').value = ''; delete cueTime.dataset.touched; cueTime.value = nowTime();
      Array.prototype.forEach.call(cueChips.querySelectorAll('.fchip'), function(c){ c.setAttribute('aria-pressed', 'false'); });
      msg.textContent = 'Clocked. You noticed it, and that counts.';
      if (reminders.auto) saveReminders(); if (!$('remind-set').hidden) drawReminders();
    }, function(){ msg.textContent = 'That didn\u2019t save. Try again.'; }).then(function(){ btn.disabled = false; });
  });

  /* ---------- Reminders: your times, a pattern suggestion, and an automatic switch (off by default) ---------- */
  var reminders = { times: [], auto: false };
  function fmt12(tm){ return fmt(tm); }
  function toMin(tm){ var p = tm.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function fromMin(m){ m = ((m % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  // Your most common time to clock an urge over the last two weeks (needs at least 3 check-ins near the same time).
  function usualTimes(){
    var since = Date.now() - 14 * 864e5, buckets = {};
    cues.filter(function(c){ return c.at >= since && c.time; }).forEach(function(c){
      var m = toMin(c.time), b = Math.floor(m / 60); (buckets[b] = buckets[b] || []).push(m);
    });
    return Object.keys(buckets).filter(function(b){ return buckets[b].length >= 3; })
      .sort(function(a, b){ return buckets[b].length - buckets[a].length; }).slice(0, 2)
      .map(function(b){ var ms = buckets[b].sort(function(x, y){ return x - y; }); var mid = ms[Math.floor(ms.length / 2)];
        return { usual: fromMin(mid), nudge: fromMin(Math.round((mid - 15) / 5) * 5) }; });
  }
  function saveReminders(){
    var p = app().updateSettings({ reminders: { times: reminders.times.slice(), auto: reminders.auto } });
    if (window.OptionalAccount && OptionalAccount.syncReminders) {
      var auto = reminders.auto ? usualTimes().map(function(u){ return u.nudge; }) : [];
      p = p.then(function(){ return OptionalAccount.syncReminders(reminders.times.concat(auto)); });
    }
    return p.catch(function(){ $('cue-remind-msg').textContent = 'That didn\u2019t save. Try again.'; });
  }
  function drawReminders(){
    var list = $('remind-list'); list.innerHTML = '';
    reminders.times.slice().sort().forEach(function(tm){
      var li = document.createElement('li');
      var txt = document.createElement('div'); txt.className = 'cuetxt'; txt.innerHTML = '<span class="ct"></span>'; txt.firstChild.textContent = fmt12(tm);
      var er = document.createElement('button'); er.type = 'button'; er.className = 'erasebtn'; er.textContent = 'Remove'; er.setAttribute('aria-label', 'Remove the ' + fmt12(tm) + ' reminder');
      er.addEventListener('click', function(){
        reminders.times = reminders.times.filter(function(t){ return t !== tm; }); drawReminders(); saveReminders();
        $('remind-time').focus();
        undoNote('Reminder removed.', function(){ reminders.times.push(tm); drawReminders(); saveReminders(); });
      });
      li.appendChild(txt); li.appendChild(er); list.appendChild(li);
    });
    $('remind-empty').hidden = reminders.times.length > 0;
    var u = usualTimes(), sug = $('remind-suggest');
    var fresh = u.filter(function(x){ return reminders.times.indexOf(x.nudge) < 0; })[0];
    if (fresh && !reminders.auto) {
      $('remind-suggest-text').textContent = 'You often clock urges around ' + fmt12(fresh.usual) + '. Want a reminder at ' + fmt12(fresh.nudge) + '?';
      sug.dataset.time = fresh.nudge; sug.hidden = false;
    } else sug.hidden = true;
    $('remind-auto').checked = !!reminders.auto;
    $('remind-auto-note').textContent = reminders.auto
      ? (u.length ? 'On. You\u2019ll get a nudge around ' + u.map(function(x){ return fmt12(x.nudge); }).join(' and ') + '. It adjusts as your patterns change.' : 'On. Once a pattern shows up in your check-ins, reminders will follow it.')
      : 'Off. Turn it on and reminders follow your patterns.';
  }
  function showReminderSettings(){ $('remind-set').hidden = false; $('cue-remind').hidden = true; drawReminders(); }
  $('remind-add').addEventListener('click', function(){
    var tm = $('remind-time').value;
    if (!tm) { $('remind-time').focus(); return; }
    if (reminders.times.indexOf(tm) < 0) { reminders.times.push(tm); drawReminders(); saveReminders(); }
    $('remind-time').value = ''; $('cue-remind-msg').textContent = 'Reminder set for ' + fmt12(tm) + '.';
  });
  $('remind-suggest-add').addEventListener('click', function(){
    var tm = $('remind-suggest').dataset.time; if (!tm) return;
    if (reminders.times.indexOf(tm) < 0) reminders.times.push(tm);
    drawReminders(); saveReminders(); $('cue-remind-msg').textContent = 'Reminder set for ' + fmt12(tm) + '.'; $('remind-time').focus();
  });
  $('remind-auto').addEventListener('change', function(){ reminders.auto = this.checked; drawReminders(); saveReminders(); });
  $('cue-remind').addEventListener('click', function(){
    var out = $('cue-remind-msg');
    var ios = /iPhone|iPad|iPod/.test(navigator.userAgent), installed = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    if (window.__previewReminders) { showReminderSettings(); return; }
    if (ios && !installed) { out.textContent = 'On iPhone, reminders work once Optional is on your home screen. In Safari, tap Share, then Add to Home Screen, then open Optional from there.'; return; }
    if (!('Notification' in window)) { out.textContent = 'This browser can\u2019t show reminders.'; return; }
    try {
      Notification.requestPermission().then(function(p){
        if (p === 'granted') {
          var setup = (window.OptionalAccount && OptionalAccount.enablePush) ? OptionalAccount.enablePush() : Promise.resolve();
          setup.then(function(){ out.textContent = 'Reminders are on.'; showReminderSettings(); saveReminders(); },
                     function(){ out.textContent = 'Reminders couldn\u2019t be turned on. Try again in a moment.'; });
        } else out.textContent = 'Notifications are blocked for Optional on this phone. Turn them on in your browser\u2019s site settings (tap the icon next to the web address), then tap Allow reminders again.';
      });
    } catch (e){ out.textContent = 'This browser can\u2019t show reminders.'; }
  });
  function startReminders(settings){
    var r = (settings && settings.reminders) || {};
    reminders = { times: Array.isArray(r.times) ? r.times.slice() : [], auto: !!r.auto };
    var granted = ('Notification' in window) && Notification.permission === 'granted';
    $('remind-set').hidden = !granted && !window.__previewReminders; $('cue-remind').hidden = !$('remind-set').hidden;
    if (!$('remind-set').hidden) drawReminders();
    // Already allowed on this phone: quietly make sure it's still set up to receive reminders.
    if (granted && window.OptionalAccount && OptionalAccount.enablePush) OptionalAccount.enablePush().catch(function(){});
  }

  /* ---------- talking to your Friend ---------- */
  var thread = $('thread'), dashIn = $('dash-input'), dashSend = $('dash-send'), convo = [], busy = false;
  var leftNote = document.createElement('p'); leftNote.className = 'chatleft'; leftNote.setAttribute('role', 'status');
  document.querySelector('#panel-talk .chead').insertAdjacentElement('afterend', leftNote);
  function friendNow(){ var w = document.querySelector('.who'); return (w && w.textContent) || 'Bestie'; }
  function nickNow(){ var n = document.querySelector('#dash-title .nick-name'); var t = n && n.textContent; return t && t !== 'You' ? t : ''; }
  function bubble(who, text){
    var e = thread.querySelector('.outempty'); if (e) e.remove();
    var p = document.createElement('p'); p.className = 'bubble ' + who; p.textContent = text;
    thread.appendChild(p); thread.scrollTop = thread.scrollHeight; return p;
  }
  async function say(text){
    text = (text || '').trim(); if (!text || busy) return;
    selectTab('talk');
    if (!noteOk) { showNote(function(){ say(text); }); return; }
    busy = true; dashSend.disabled = true;
    bubble('me', text); convo.push({ role: 'user', text: text });
    $('clear-talk').hidden = false;
    var wait = bubble('friend', '\u2026'); wait.setAttribute('aria-label', friendNow() + ' is typing');
    var r = await window.OptionalAccount.askBestie(convo.slice(), friendNow(), nickNow());
    var answer;
    if (r && r.text) { answer = r.text; convo.push({ role: 'assistant', text: answer }); }
    else {
      convo.pop();
      if (r && r.error === 'not_connected') answer = friendNow() + '\u2019s traversing the interwebs, making their way to you. Be here when they land.';
      else if (r && r.error === 'limit') answer = 'I\u2019m glad you\u2019re expressing yourself. Let\u2019s keep it going tomorrow. If you need more help now, tap Help if Needed in the menu.';
      else if (r && r.error === 'login') answer = 'Log back in and I\u2019ll be right here.';
      else answer = 'Uh-oh... I\u2019m at a loss for words. Give me a moment and try again.';
    }
    wait.textContent = answer; wait.removeAttribute('aria-label');
    leftNote.textContent = (r && typeof r.left === 'number' && r.left <= 10) ? r.left + (r.left === 1 ? ' message' : ' messages') + ' left today.' : '';
    thread.scrollTop = thread.scrollHeight;
    busy = false; dashSend.disabled = false;
  }
  // A grounding note: shown the first time the chat opens after each login. They tap "I understand" before chatting.
  var noteOk = false, noteThen = null;
  function chatVisible(){ var p = $('dash'); return !p.hidden && !p.classList.contains('locked') && !$('panel-talk').hidden; }
  function showNote(then){
    if (then) noteThen = then;
    var sc = $('bestie-note'); if (!sc.hidden) return;
    sc.hidden = false; document.body.style.overflow = 'hidden'; $('bnote-ok').focus();
  }
  function maybeNote(){ if (!noteOk && chatVisible()) showNote(); }
  $('bnote-ok').addEventListener('click', function(){
    noteOk = true; $('bestie-note').hidden = true; document.body.style.overflow = '';
    var t = noteThen; noteThen = null; if (t) t(); else dashIn.focus();
  });
  $('bestie-note').addEventListener('keydown', function(e){ if (e.key === 'Tab') { e.preventDefault(); $('bnote-ok').focus(); } });

  function sendBox(){ var t = dashIn.value; dashIn.value = ''; say(t); dashIn.focus(); }
  dashSend.addEventListener('click', sendBox);
  dashIn.addEventListener('keydown', function(e){ if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBox(); } });
  $('dash-pulse').addEventListener('click', function(){ var p = $('open-pulse'); if (p) p.click(); });

  /* ---------- mood stickers ---------- */
  var moodRow = document.querySelector('.moodrow');
  $('mood-change').addEventListener('click', function(){ moodRow.classList.remove('picked'); this.hidden = true; var p = document.querySelector('#mood-chips .fchip[aria-pressed="true"]'); (p || document.querySelector('#mood-chips .fchip')).focus(); });
  Array.prototype.forEach.call(document.querySelectorAll('#mood-chips .fchip'), function(c){
    c.addEventListener('click', function(){
      Array.prototype.forEach.call(document.querySelectorAll('#mood-chips .fchip'), function(o){ o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); });
      moodRow.classList.add('picked'); $('mood-change').hidden = false;
      if (c.classList.contains('other')) { selectTab('talk'); dashIn.placeholder = 'Tell me how you\u2019re feeling...'; dashIn.focus(); return; }
      say(c.textContent);
    });
  });

  /* ---------- what app.js and inapp.js call ---------- */
  var loaded = false;
  async function loadEntries(){
    try {
      var j = await Acc.listEntries('journal'); journal = j; drawJournal();
      var c = await Acc.listEntries('cue');
      cues = c.map(function(e){ return { id: e.id, at: Date.parse(e.at) || Date.now(), time: e.value.time, feels: e.value.feels || [], what: e.value.what || '' }; });
      drawCues(); drawPatterns(); loaded = true; if (!$('remind-set').hidden) { drawReminders(); if (reminders.auto) saveReminders(); }
    } catch (e){ undoNote('Your journal and check-ins didn\u2019t load. Try again in a moment.'); }
  }
  window.OptionalDash = {
    confirmIt: confirmIt,
    reload: function(){ return loadEntries(); },
    unlocked: function(){ setTimeout(maybeNote, 50); },
    start: function(settings){
      settings = settings || {};
      chosen.me = SETS.me[settings.avatar] ? settings.avatar : 'curly';
      chosen.friend = SETS.friend[settings.friendLook] ? settings.friendLook : 'elephant';
      paint();
      if (window.OptionalHide) OptionalHide.load(settings.hidden);
      startReminders(settings);
      loaded = false; loadEntries();
    },
    onShow: function(id){
      if (id === 'dash' && !loaded) loadEntries();
      if (window.OptionalLock) OptionalLock.check();
    },
    sendFromBar: function(text){
      // Wait until the page is unlocked, then send what they typed in the companion bar.
      var tries = 0, page = $('dash');
      (function wait(){
        if (page.classList.contains('locked') || page.hidden) { if (++tries < 1000) setTimeout(wait, 300); return; }
        if ((text || '').trim()) say(text); else dashIn.focus();
      })();
    },
    reset: function(){
      convo = []; journal = []; cues = []; loaded = false; noteOk = false; noteThen = null; $('bestie-note').hidden = true;
      thread.innerHTML = '<p class="outempty">Drop your thoughts, or pick a feeling above.</p>';
      $('clear-talk').hidden = true; leftNote.textContent = ''; drawJournal(); drawCues(); drawPatterns();
      reminders = { times: [], auto: false }; $('remind-set').hidden = true; $('cue-remind').hidden = false;
      moodRow.classList.remove('picked'); $('mood-change').hidden = true;
      Array.prototype.forEach.call(document.querySelectorAll('#mood-chips .fchip'), function(o){ o.setAttribute('aria-pressed', 'false'); });
      if (window.OptionalHide) OptionalHide.reset();
      if (window.OptionalLock) OptionalLock.lock();
    }
  };
})();

/* ===== Hide feature: ⋯ → panel → hide, with an Undo note ===== */
(function(){
  var hidden=[];
  function save(a){ if (window.OptionalApp && OptionalApp.updateSettings) OptionalApp.updateSettings({ hidden: a.slice() }).catch(function(){}); }
  function apply(){ document.querySelectorAll('[data-key]').forEach(function(el){ el.classList.toggle('is-hidden', hidden.indexOf(el.getAttribute('data-key'))>-1); }); }
  apply();
  var scrim=document.getElementById('hide-scrim'), title=document.getElementById('hide-title'), yes=document.getElementById('hide-yes'),
      cancel=document.getElementById('hide-cancel'), toast=document.getElementById('hide-toast'), msg=document.getElementById('hide-msg'),
      undo=document.getElementById('hide-undo'), current=null, opener=null, timer=null, last=null;
  function open(btn){ opener=btn; current={key:btn.getAttribute('data-hide'), name:btn.getAttribute('data-name')};
    title.textContent=current.name; yes.textContent='Hide here'; scrim.hidden=false; yes.focus(); }
  function close(back){ scrim.hidden=true; if(back && opener && document.body.contains(opener) && opener.offsetParent) opener.focus(); }
  document.querySelectorAll('.morebtn').forEach(function(b){ b.addEventListener('click', function(e){ e.stopPropagation(); open(b); }); });
  cancel.addEventListener('click', function(){ close(true); });
  document.getElementById('hide-settings').addEventListener('click', function(){ close(false); msg.textContent='Settings is coming soon.'; undo.hidden=true; toast.hidden=false; startTimer(); if(opener && opener.offsetParent) opener.focus(); });
  scrim.addEventListener('click', function(e){ if(e.target===scrim) close(true); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape' && !scrim.hidden){ e.stopPropagation(); close(true); } }, true);
  scrim.addEventListener('keydown', function(e){ if(e.key!=='Tab') return; var f=[yes,document.getElementById('hide-settings'),cancel], i=f.indexOf(document.activeElement);
    if(e.shiftKey && i<=0){ e.preventDefault(); f[f.length-1].focus(); } else if(!e.shiftKey && i===f.length-1){ e.preventDefault(); yes.focus(); } });
  function hideToast(){ toast.hidden=true; clearTimeout(timer); }
  function startTimer(){ clearTimeout(timer); timer=setTimeout(hideToast, 7000); }
  yes.addEventListener('click', function(){
    if(hidden.indexOf(current.key)<0) hidden.push(current.key); save(hidden); apply(); last=current; close(false);
    msg.textContent=current.name+' is hidden. You can bring it back in Settings.'; undo.hidden=false; toast.hidden=false; startTimer();
    var inMenu=opener && opener.closest('.menulist'), next=inMenu ? opener.closest('.menulist').querySelector('li:not(.is-hidden) button') : document.querySelector('#options h1');
    if(next){ if(!inMenu) next.setAttribute('tabindex','-1'); next.focus(); } });
  undo.addEventListener('click', function(){ if(!last) return; hidden=hidden.filter(function(k){ return k!==last.key; }); save(hidden); apply(); hideToast();
    var b=document.querySelector('.stripwrap [data-hide="'+last.key+'"]'); if(b && b.offsetParent) b.focus(); });
  ['mouseenter','focusin'].forEach(function(ev){ toast.addEventListener(ev, function(){ clearTimeout(timer); }); });
  ['mouseleave','focusout'].forEach(function(ev){ toast.addEventListener(ev, function(e){ if(ev==='focusout' && toast.contains(e.relatedTarget)) return; if(!toast.hidden) startTimer(); }); });
  window.OptionalHide={ load:function(list){ hidden=Array.isArray(list)?list.slice():[]; apply(); }, reset:function(){ hidden=[]; apply(); } };
})();

/* ===== Page lock for Astride & Bestie: PIN, plus Face ID / fingerprint where the phone offers it ===== */
(function(){
  var you = document.getElementById('dash'), box = document.getElementById('lock');
  var K = 'optional-lock', unlockedAt = 0;
  function get(){ try { return JSON.parse(localStorage.getItem(K) || 'null'); } catch (e){ return null; } }
  function put(v){ try { localStorage.setItem(K, JSON.stringify(v)); } catch (e){} }
  var mem = get();
  function b64(buf){ return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))); }
  function unb64(s){ return Uint8Array.from(atob(s), function(c){ return c.charCodeAt(0); }); }
  function rand(n){ var a = new Uint8Array(n); crypto.getRandomValues(a); return a; }
  async function hash(pin, salt){
    var data = new TextEncoder().encode(salt + ':' + pin);
    if (crypto.subtle) return b64(await crypto.subtle.digest('SHA-256', data));
    var h = 0; for (var i = 0; i < data.length; i++) h = (h * 31 + data[i]) | 0; return String(h);
  }
  var bioOK = false;
  (async function(){ try { bioOK = !!(window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); } catch (e){ bioOK = false; } draw(); })();
  function $(id){ return document.getElementById(id); }
  function show(id){ ['lock-setup','lock-bio-offer','lock-locked'].forEach(function(s){ $(s).hidden = (s !== id); }); box.querySelector('.lockcardwrap').hidden = (id === 'lock-locked'); }
  function draw(){
    if (!mem) { show('lock-setup'); }
    else { show('lock-locked'); $('lock-bio').hidden = !(bioOK && mem.cred); }
  }
  // How long the page stays unlocked after you step away: 1, 10 or 30 minutes, or until the app is closed.
  var leftAt = 0;
  function mode(){ return (mem && mem.after) || 'closed'; }
  function isOpen(){
    if (!unlockedAt) return false;
    if (mode() === 'closed' || !leftAt) return true;
    return Date.now() - leftAt < (+mode()) * 60000;
  }
  function behind(on){ Array.prototype.forEach.call(you.children, function(c){ if (c !== box) { if (on) c.setAttribute('inert', ''); else c.removeAttribute('inert'); c.setAttribute('aria-hidden', on ? 'true' : 'false'); } }); }
  function zone(){ var n = document.querySelector('#dash-title .nick-name'); var t = n && n.textContent; document.querySelectorAll('.zone-name').forEach(function(z){ z.textContent = (t && t !== 'You') ? t : 'your'; }); }
  function lock(){ zone(); unlockedAt = 0; leftAt = 0; you.classList.add('locked'); behind(true); box.hidden = false; draw(); }
  function unlock(){
    unlockedAt = Date.now(); leftAt = 0; you.classList.remove('locked'); behind(false); box.hidden = true;
    ['lock-pin','lock-pin2','lock-pin-in'].forEach(function(i){ $(i).value = ''; });
    var b = document.getElementById('back-home'); if (b) b.focus();
    if (window.OptionalDash && OptionalDash.unlocked) OptionalDash.unlocked();
  }
  function check(){
    if (location.hash !== '#dash') { if (unlockedAt && !leftAt) leftAt = Date.now(); return; }
    if (isOpen()) { leftAt = 0; you.classList.remove('locked'); behind(false); box.hidden = true; if (window.OptionalDash && OptionalDash.unlocked) OptionalDash.unlocked(); return; }
    lock(); setTimeout(function(){ var h = box.querySelector('section:not([hidden]) h2'); if (h) h.focus(); }, 30);
  }
  document.addEventListener('visibilitychange', function(){
    if (document.hidden) { if (unlockedAt && !leftAt) leftAt = Date.now(); }
    else if (location.hash === '#dash') check();
  });
  var AFTER_LABELS = { '1': 'After 1 minute', '10': 'After 10 minutes', '30': 'After 30 minutes', 'closed': 'Only when the app is closed' };
  function showAfter(){ var l = $('autolock-label'); if (l) l.textContent = AFTER_LABELS[mode()] || AFTER_LABELS.closed; }
  function setAfter(v){ if (!mem) return; mem.after = v; put(mem); showAfter(); }
  document.querySelectorAll('input[name="lock-after"]').forEach(function(r){ r.addEventListener('change', function(){ if (this.checked) { if (mem) setAfter(this.value); else pendingAfter = this.value; } }); });
  var pendingAfter = 'closed';
  var alScrim = $('autolock-scrim');
  $('autolock-change').addEventListener('click', function(){
    document.querySelectorAll('input[name="lock-after2"]').forEach(function(r){ r.checked = r.value === mode(); });
    alScrim.hidden = false; var on = alScrim.querySelector('input:checked') || alScrim.querySelector('input'); on.focus();
  });
  document.querySelectorAll('input[name="lock-after2"]').forEach(function(r){ r.addEventListener('change', function(){ if (this.checked) setAfter(this.value); }); });
  $('autolock-done').addEventListener('click', function(){ alScrim.hidden = true; $('autolock-change').focus(); });
  alScrim.addEventListener('keydown', function(e){ if (e.key === 'Escape') { alScrim.hidden = true; $('autolock-change').focus(); } });
  showAfter();
  window.addEventListener('hashchange', check);
  function msg(id, t){ $(id).textContent = t; }
  function goodPin(p){ return /^\d{4,6}$/.test(p); }
  $('lock-save').addEventListener('click', async function(){
    var a = $('lock-pin').value.trim(), b = $('lock-pin2').value.trim();
    if (!goodPin(a)) { msg('lock-setup-msg', 'Use 4 to 6 numbers.'); $('lock-pin').focus(); return; }
    if (a !== b) { msg('lock-setup-msg', 'Those two don’t match. Try again.'); $('lock-pin2').focus(); return; }
    var salt = b64(rand(16)); mem = { salt: salt, pin: await hash(a, salt), cred: null, after: pendingAfter }; put(mem); showAfter();
    if (bioOK) { show('lock-bio-offer'); $('lock-bio-title').focus(); } else unlock();
  });
  $('lock-bio-yes').addEventListener('click', async function(){
    try {
      var c = await navigator.credentials.create({ publicKey: {
        challenge: rand(32), rp: { name: 'Optional' },
        user: { id: rand(16), name: 'optional-user', displayName: 'Optional' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' }, timeout: 60000 } });
      mem.cred = b64(c.rawId); put(mem); unlock();
    } catch (e){ msg('lock-bio-msg', 'That didn’t work. You can use your PIN, and try again later in Settings.'); }
  });
  $('lock-bio-no').addEventListener('click', unlock);
  $('lock-bio').addEventListener('click', async function(){
    try {
      await navigator.credentials.get({ publicKey: { challenge: rand(32), allowCredentials: [{ type: 'public-key', id: unb64(mem.cred) }], userVerification: 'required', timeout: 60000 } });
      unlock();
    } catch (e){ msg('lock-msg', 'That didn’t work. Try again, or use your PIN.'); }
  });
  async function tryPin(){
    var p = $('lock-pin-in').value.trim();
    if (!p) { $('lock-pin-in').focus(); return; }
    if (await hash(p, mem.salt) === mem.pin) unlock();
    else { msg('lock-msg', 'That PIN didn’t match. Try again.'); $('lock-pin-in').value = ''; $('lock-pin-in').focus(); }
  }
  $('lock-unlock').addEventListener('click', tryPin);
  $('lock-pin-in').addEventListener('keydown', function(e){ if (e.key === 'Enter') { e.preventDefault(); tryPin(); } });
  $('lock-forgot').addEventListener('click', function(){
    if (window.OptionalDash && OptionalDash.confirmIt) OptionalDash.confirmIt('Reset your PIN?', 'You\u2019ll be logged out. Log back in with your password, then pick a new PIN.', 'Log out', function(){ mem = null; put(null); var o = document.querySelector('.do-logout'); if (o) o.click(); });
  });
  window.OptionalLock = { check: check, lock: lock, reset: function(){ mem = null; put(null); try { localStorage.removeItem(K); } catch (e){} lock(); } };
  check();
})();
