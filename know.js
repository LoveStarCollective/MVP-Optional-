// ===== Good to Know =====
// A corkboard of things worth a look. Every card (and every category) can be hidden with the eyelids.
// The Help card at the top can never be hidden.
// To add a pin: put { id, type, title, by, meta, cats:[...], why, url } in PINS.
(function(){
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  var LIDS = '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5c2.4 3.2 5.4 4.8 9 4.8s6.6-1.6 9-4.8"/><path d="M5.6 13.4l-1.6 2.2"/><path d="M9.6 15l-.6 2.7"/><path d="M14.4 15l.6 2.7"/><path d="M18.4 13.4l1.6 2.2"/></svg>';
  var CATS = ['All', 'Books', 'Videos', 'Articles', 'Podcasts', 'Music', 'Understanding Addiction', 'Mental Health', 'Wisdom Traditions', 'Helpful Fables', 'Stories'];
  var PINC = ['red', 'blue', 'green', 'amber', 'pink'];

  // Starter pins. The "why" lines are drafts for Astride to edit.
  var PINS = [
    { id:'bkts', type:'Book', title:'The Body Keeps the Score', by:'Bessel van der Kolk', meta:'book', cats:['Books', 'Understanding Addiction'],
      why:'Explores how stress and hard experiences can live in the body, and the ways people find their way back to feeling at home in themselves.',
      url:'https://www.penguinrandomhouse.com/books/313183/the-body-keeps-the-score-by-bessel-van-der-kolk-md/' },
    { id:'tnm', type:'Book', title:'This Naked Mind', by:'Annie Grace', meta:'book', cats:['Books', 'Understanding Addiction'],
      why:'A curious, judgment-free look at how we think about alcohol, and how questioning those beliefs can change the way drinking feels.',
      url:'https://www.penguinrandomhouse.com/books/577190/this-naked-mind-by-annie-grace/' },
    { id:'hari', type:'Video', title:'Everything you think you know about addiction is wrong', by:'Johann Hari, TED', meta:'15 min', cats:['Videos', 'Understanding Addiction'],
      why:'A personal talk about what really drives addiction, and why connection might matter more than we think.',
      url:'https://www.ted.com/talks/johann_hari_everything_you_think_you_know_about_addiction_is_wrong' },
    { id:'rhg', type:'Book', title:'In the Realm of Hungry Ghosts', by:'Gabor Maté', meta:'book', cats:['Books', 'Understanding Addiction'],
      why:'A compassionate look at addiction through real people’s lives, and how pain and connection shape our habits.',
      url:'https://northatlanticbooks.com/?p=46471' },
    { id:'dopa', type:'Book', title:'Dopamine Nation', by:'Anna Lembke', meta:'book', cats:['Books', 'Understanding Addiction'],
      why:'Explains the brain’s pleasure and pain balance in plain language, and why too much of a good thing can tip it.',
      url:'https://www.penguinrandomhouse.com/books/624957/dopamine-nation-by-anna-lembke-md/' },
    { id:'atomic', type:'Book', title:'Atomic Habits', by:'James Clear', meta:'book', cats:['Books'],
      why:'Practical ideas on how small changes add up, and how noticing your cues can help shape new habits.',
      url:'https://www.penguinrandomhouse.com/books/543993/atomic-habits-by-james-clear/9780735211292/' },
    { id:'alied', type:'Book', title:'Alcohol Lied to Me', by:'Craig Beck', meta:'book', cats:['Books', 'Understanding Addiction'],
      why:'A former heavy drinker shares how he saw through the stories he told himself about alcohol, in a friendly, down-to-earth way.' },
    { id:'hopestream', type:'Podcast', title:'You Can’t Love Your Child Out of Addiction', by:'Hopestream, with Megan Megale of American Boy', meta:'1 hr', cats:['Podcasts', 'Stories'],
      why:'Megan shares her family’s fight to save her son Matt from heroin addiction, what she now thinks may have hurt his recovery, and how her foundation helps other families.',
      url:'https://podcasts.apple.com/us/podcast/you-cant-love-your-child-out-of-addiction-with/id1494533993?i=1000475151796' },
    { id:'cschiz', type:'Book', title:'The Collected Schizophrenias', by:'Esmé Weijun Wang', meta:'book', cats:['Books', 'Mental Health', 'Stories'],
      why:'Personal essays about living with schizoaffective disorder, written with honesty, curiosity and care.',
      url:'https://www.graywolfpress.org/node/24297' },
    { id:'dsm', type:'Book', title:'DSM-5-TR', by:'American Psychiatric Association', meta:'book', cats:['Books', 'Mental Health'],
      why:'The manual clinicians use to describe mental health conditions. Dense, but helpful for understanding the language behind a diagnosis.',
      url:'https://psychiatry.org/patients-families/what-is-the-dsm' },
    { id:'sutras', type:'Book', title:'The Yoga Sutras of Patanjali', by:'Sri Swami Satchidananda', meta:'book', cats:['Books', 'Wisdom Traditions'],
      why:'An ancient guide to quieting the mind, with clear, gentle commentary on how to bring it into everyday life.',
      url:'https://www.goodreads.com/book/show/56305' },
    { id:'tao', type:'Book', title:'Tao Te Ching', by:'Lao Tsu, translated by Gia-Fu Feng and Jane English', meta:'book', cats:['Books', 'Wisdom Traditions'],
      why:'Short, timeless verses on balance, ease and letting things unfold instead of forcing them.',
      url:'https://www.penguinrandomhouse.com/books/180810/tao-te-ching-by-lao-tsu-trans-gia-fu-feng-and-jane-english-with-toinette-lippe-intro-jacob-needleman/9780307949301/' },
    { id:'secretys', type:'Book', title:'The Secret of the Yoga Sutra', by:'Pandit Rajmani Tigunait, Himalayan Institute', meta:'book', cats:['Books', 'Wisdom Traditions'],
      why:'A deep, practical look at the Yoga Sutra and what it says about the mind and lasting peace.',
      url:'https://shop.himalayaninstitute.org/products/the-secret-of-the-yoga-sutra' },
    { id:'practys', type:'Book', title:'The Practice of the Yoga Sutra', by:'Pandit Rajmani Tigunait, Himalayan Institute', meta:'book', cats:['Books', 'Wisdom Traditions'],
      why:'Builds on The Secret of the Yoga Sutra with a focus on daily practice and the steps along the way.',
      url:'https://shop.himalayaninstitute.org/products/practice-of-the-yoga-sutra' },
    { id:'fire', type:'Book', title:'Touched by Fire', by:'Pandit Rajmani Tigunait, Himalayan Institute', meta:'book', cats:['Books', 'Wisdom Traditions', 'Stories'],
      why:'His own story of growing up in India and the teachers and experiences that shaped his path.',
      url:'https://shop.himalayaninstitute.org/products/touched-by-fire' },
    { id:'sovself', type:'Book', title:'Sovereign Self', by:'Acharya Shunya', meta:'book', cats:['Books', 'Wisdom Traditions'],
      why:'Ancient Vedic teachings made personal and practical, about trusting your own inner wisdom.',
      url:'https://soundstrue.com/products/sovereign-self' },
    { id:'yamas', type:'Book', title:'The Yamas & Niyamas', by:'Deborah Adele', meta:'book', cats:['Books', 'Wisdom Traditions'],
      why:'A warm, everyday look at yoga’s guidelines for living, like non-harming, truthfulness and contentment.' },
    { id:'livsober', type:'Book', title:'Living Sober', by:'Alcoholics Anonymous', meta:'book', cats:['Books', 'Understanding Addiction'],
      why:'Short, practical tips people have used to get through the day without a drink.',
      url:'https://www.aa.org/living-sober-book' },
    { id:'aexpl', type:'Book', title:'Alcohol Explained', by:'William Porter', meta:'book', cats:['Books', 'Understanding Addiction'],
      why:'A clear, science-based look at what alcohol does to the body and mind, and why it can feel so hard to cut back.' },
    { id:'radacc', type:'Book', title:'Radical Acceptance', by:'Tara Brach', meta:'book', cats:['Books', 'Wisdom Traditions', 'Mental Health'],
      why:'Buddhist teachings and real stories about meeting yourself with kindness instead of judgment.',
      url:'https://www.penguinrandomhouse.com/books/16998/radical-acceptance-by-tara-brach-phd/' },
    { id:'now', type:'Book', title:'The Power of Now', by:'Eckhart Tolle', meta:'book', cats:['Books', 'Wisdom Traditions'],
      why:'An invitation to step out of racing thoughts and into the present moment.',
      url:'https://newworldlibrary.com/?p=63' },
    { id:'alchemist', type:'Book', title:'The Alchemist', by:'Paulo Coelho', meta:'book', cats:['Books', 'Helpful Fables'],
      why:'A short fable about following your heart and noticing the signs along the way.' },
    { id:'mindset', type:'Book', title:'Mindset', by:'Carol S. Dweck', meta:'book', cats:['Books', 'Mental Health'],
      why:'How believing you can grow, rather than being stuck as you are, can change the way you face setbacks.',
      url:'https://www.penguinrandomhouse.com/books/44330/mindset-by-carol-s-dweck-phd/' },
    { id:'artway', type:'Book', title:'The Artist’s Way', by:'Julia Cameron', meta:'book, 30th anniversary edition', cats:['Books'],
      why:'A gentle, 12-week path back to creativity, including the daily habit of morning pages.',
      url:'https://www.penguinrandomhouse.com/books/349644/the-artists-way-by-julia-cameron/' },
    { id:'cbt', type:'Course', title:'Cognitive Behavioral Therapy: Techniques for Retraining Your Brain', by:'Jason M. Satterfield, The Great Courses', meta:'course', cats:['Mental Health'],
      why:'Lessons from a clinical psychologist on how thoughts, feelings and actions connect, with tools you can try on your own.',
      url:'https://plus.thegreatcourses.com/cognitive-behavioral-therapy-techniques-for-retraining-your-brain' },
    { id:'nogen', type:'Book', title:'Nothing General About It', by:'Maurice Benard', meta:'book', cats:['Books', 'Mental Health', 'Stories'],
      why:'The General Hospital actor’s honest story of living with bipolar disorder, and the love and support that helped him through.',
      url:'https://www.goodreads.com/book/show/52874324' },
    { id:'som', type:'Video', title:'State of Mind with Maurice Benard', by:'Maurice Benard', meta:'YouTube show', cats:['Videos', 'Mental Health', 'Stories'],
      why:'Open conversations with actors and guests about anxiety, depression, grief and getting through hard times.',
      url:'https://www.youtube.com/@mbstateofmind' }
  ];
  var TYPECLASS = { Book:'t-book', Video:'t-video', Article:'t-read', Podcast:'t-audio', Music:'t-music', Story:'t-story', Link:'t-link', Course:'t-video' };

  var hidden = [];
  try { hidden = JSON.parse(localStorage.getItem('optional-know-hidden') || '[]'); } catch (e){}
  function save(){ try { localStorage.setItem('optional-know-hidden', JSON.stringify(hidden)); } catch (e){} }
  var COMM = [];   // approved community pins, loaded from the database
  function all(){ return PINS.concat(COMM); }
  function pin(id){ var a = all(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; }
  function label(k){ if (k.indexOf('cat:') === 0) return k.slice(4) + ' (category)'; var p = pin(k); return p ? p.title : k; }
  function isHidden(p){ if (hidden.indexOf(p.id) !== -1) return true; for (var i = 0; i < p.cats.length; i++) if (hidden.indexOf('cat:' + p.cats[i]) !== -1) return true; return false; }

  var cat = 'All', lastHidden = null, tt = null;
  function toast(msg){
    var t = $('k-toast'); t.textContent = msg; t.hidden = false; t.classList.remove('fade');
    var u = document.createElement('button'); u.type = 'button'; u.className = 'wundo'; u.textContent = 'Undo';
    u.addEventListener('click', function(){ var i = hidden.indexOf(lastHidden); if (i !== -1){ hidden.splice(i, 1); save(); } t.hidden = true; draw(); });
    t.appendChild(document.createTextNode(' ')); t.appendChild(u);
    clearTimeout(tt); tt = setTimeout(function(){ t.classList.add('fade'); tt = setTimeout(function(){ t.hidden = true; }, 400); }, 3500);
  }
  function hide(k){ hidden.push(k); save(); lastHidden = k; toast(label(k) + ' hidden.'); draw(); }

  function drawChips(){
    var w = $('k-chips'); w.innerHTML = '';
    CATS.forEach(function(c){
      if (c !== 'All' && hidden.indexOf('cat:' + c) !== -1) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'fchip'; b.textContent = c; b.setAttribute('aria-pressed', c === cat ? 'true' : 'false');
      b.addEventListener('click', function(){ cat = c; draw(); });
      w.appendChild(b);
    });
  }
  function draw(){
    if (cat !== 'All' && hidden.indexOf('cat:' + cat) !== -1) cat = 'All';
    drawChips();
    var board = $('k-cards'); board.innerHTML = '';
    var A = all();
    var list = A.filter(function(p){ return !isHidden(p) && (cat === 'All' || p.cats.indexOf(cat) !== -1); });
    if (!list.length) board.innerHTML = '<p class="kempty">Nothing pinned here yet.</p>';
    list.forEach(function(p, i){
      var d = document.createElement('div'); d.className = 'kcard pin-' + PINC[A.indexOf(p) % 5];
      d.style.setProperty('--tilt', ((A.indexOf(p) * 37) % 5 - 2) * 0.6 + 'deg');
      d.innerHTML = '<button type="button" class="kopen" aria-label="' + esc(p.type + ': ' + p.title + (p.by ? ', by ' + p.by : '') + (p.community ? ', pinned by ' + p.from : '')) + '">' +
        '<span class="ktype ' + (TYPECLASS[p.type] || 't-link') + '" aria-hidden="true">' + esc(p.type) + '</span>' +
        '<span class="ktitle" aria-hidden="true">' + esc(p.title) + '</span>' +
        '<span class="kby" aria-hidden="true">' + esc(p.by) + '</span>' +
        '<span class="kmeta" aria-hidden="true">' + esc(p.meta) + '</span>' +
        (p.community ? '<span class="kfrom" aria-hidden="true">Pinned by ' + esc(p.from) + '</span>' : '') + '</button>' +
        '<button type="button" class="feye keye" aria-label="Hide ' + esc(p.title) + '">' + LIDS + '</button>';
      d.querySelector('.kopen').addEventListener('click', function(){ openPin(p, this); });
      d.querySelector('.keye').addEventListener('click', function(){ hide(p.id); });
      board.appendChild(d);
    });
    // hidden items box
    var box = $('k-hidden'), hl = $('k-hidlist');
    box.hidden = !hidden.length; $('k-hidcount').textContent = hidden.length ? '(' + hidden.length + ')' : '';
    hl.innerHTML = '';
    hidden.forEach(function(k){
      var li = document.createElement('li'); li.innerHTML = '<span>' + esc(label(k)) + '</span>';
      var b = document.createElement('button'); b.type = 'button'; b.className = 'linkbtn'; b.textContent = 'Bring back'; b.setAttribute('aria-label', 'Bring back ' + label(k));
      b.addEventListener('click', function(){ var i = hidden.indexOf(k); if (i !== -1){ hidden.splice(i, 1); save(); } draw(); $('k-hidtoggle').focus(); });
      li.appendChild(b); hl.appendChild(li);
    });
  }
  $('k-hidtoggle').addEventListener('click', function(){ var o = this.getAttribute('aria-expanded') !== 'true'; this.setAttribute('aria-expanded', o ? 'true' : 'false'); $('k-hidlist').hidden = !o; });

  // sheets
  var opener = null, openSc = null;
  function openSheet(sc, focusEl){ opener = document.activeElement; openSc = sc; sc.hidden = false; document.body.style.overflow = 'hidden'; focusEl.setAttribute('tabindex', '-1'); focusEl.focus(); }
  function closeSheet(){ if (!openSc) return; openSc.hidden = true; openSc = null; document.body.style.overflow = ''; if (opener && opener.focus) opener.focus(); }
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeSheet(); });
  $('k-close').addEventListener('click', closeSheet);
  $('kh-close').addEventListener('click', closeSheet);
  function openPin(p){
    $('k-title').textContent = p.title;
    // Every pick links somewhere to learn more. Books without a link open a Goodreads search for that title and author.
    if (!(p.url && /^https:\/\//.test(p.url))){
      var q = encodeURIComponent((p.title + ' ' + (p.by || '').split(',')[0]).trim());
      if (p.type === 'Book') p.url = 'https://www.goodreads.com/search?q=' + q;
      else if (p.type === 'Course') p.url = 'https://www.amazon.com/s?k=' + q;
    }
    var link = p.url && /^https:\/\//.test(p.url) ? '<a class="startbtn kgo" href="' + esc(p.url) + '" target="_blank" rel="noopener">' + (p.type === 'Video' ? 'Watch' : p.type === 'Podcast' ? 'Listen' : p.type === 'Book' ? 'Find the book' : p.type === 'Course' ? 'Find the course' : 'Open') + '<span class="sr-only"> (opens a new page)</span></a>' : '';
    $('k-body').innerHTML = '<p class="kshby"><span class="ktype ' + (TYPECLASS[p.type] || 't-link') + '">' + esc(p.type) + '</span> ' + esc([p.by, p.meta].filter(Boolean).join(' · ')) + '</p>' +
      '<div class="mwhy kwhy"><span class="mwhylbl">' + (p.community ? 'Why it helped' : 'Why it’s worth a look') + '</span><p>' + esc(p.why) + '</p></div>' + link +
      (p.community ? '<p class="kshfrom">Pinned by ' + esc(p.from) + '</p><p class="kreport"><button type="button" class="linkbtn" id="k-report">Report this pin</button></p>' : '');
    openSheet($('k-scrim'), $('k-title'));
    var rb = $('k-report');
    if (rb) rb.addEventListener('click', function(){
      var btn = this; btn.disabled = true;
      Promise.resolve(window.OptionalAccount && OptionalAccount.reportPin ? OptionalAccount.reportPin(p.dbid) : null).then(function(){
        btn.parentNode.textContent = 'Thanks for letting us know. We’ll take a look, and it’s hidden for you now.';
        if (hidden.indexOf(p.id) === -1){ hidden.push(p.id); save(); draw(); }
      }, function(){ btn.disabled = false; btn.textContent = 'Couldn’t send that. Try again?'; });
    });
  }
  $('k-helpcard').addEventListener('click', function(){ openSheet($('kh-scrim'), $('kh-title')); });

  var started = false;

  // ---------- community pins ----------
  var CAT_CHOICES = CATS.filter(function(c){ return c !== 'All'; });
  var TYPES = ['Book', 'Video', 'Article', 'Podcast', 'Music', 'Story', 'Link'];
  function loadComm(){
    if (!window.OptionalAccount || !OptionalAccount.listPins) return;
    OptionalAccount.listPins().then(function(rows){
      COMM = rows.filter(function(r){ return r && r.title && r.why; }).map(function(r){
        return { id:'c-' + r.id, dbid:r.id, community:true, type:TYPES.indexOf(r.type) !== -1 ? r.type : 'Link', title:r.title, by:r.by || '', meta:'',
          cats:(r.cats || []).filter(function(c){ return CAT_CHOICES.indexOf(c) !== -1; }), why:r.why, url:r.url || '', from:r.nickname || 'someone in the community' };
      });
      draw();
    }, function(){ /* the board still works without them */ });
  }
  function oneMonthAfter(iso){ var d = new Date(iso); d.setMonth(d.getMonth() + 1); return d; }
  function startShare(){
    var btn = $('k-share'); btn.disabled = true;
    Promise.resolve(OptionalAccount.accountCreatedAt()).then(function(made){
      btn.disabled = false;
      var opens = oneMonthAfter(made);
      if (new Date() < opens){
        $('kw-when').textContent = opens.toLocaleDateString(undefined, { month:'long', day:'numeric' });
        openSheet($('kw-scrim'), $('kw-title'));
      } else { openForm(); }
    }, function(){ btn.disabled = false; plainToast('Couldn’t check your account just now. Try again in a bit.'); });
  }
  var picked = [];
  function openForm(){
    $('kp-form').reset(); picked = []; $('kp-err').textContent = '';
    var nick = window.OptionalApp && OptionalApp.nick ? OptionalApp.nick() : '';
    $('kp-nickname').textContent = nick || 'your nickname';
    $('kp-nickrow').hidden = !nick;
    if (!nick){ var an = document.querySelector('#kp-form input[name="who"][value="anon"]'); if (an) an.checked = true; }
    var w = $('kp-cats'); w.innerHTML = '';
    CAT_CHOICES.forEach(function(c){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'fchip'; b.textContent = c; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function(){ var i = picked.indexOf(c); if (i === -1) picked.push(c); else picked.splice(i, 1); b.setAttribute('aria-pressed', i === -1 ? 'true' : 'false'); });
      w.appendChild(b);
    });
    openSheet($('kp-scrim'), $('kp-title'));
  }
  function plainToast(msg){
    var t = $('k-toast'); t.textContent = msg; t.hidden = false; t.classList.remove('fade');
    clearTimeout(tt); tt = setTimeout(function(){ t.classList.add('fade'); tt = setTimeout(function(){ t.hidden = true; }, 400); }, 4500);
  }
  $('k-share').addEventListener('click', startShare);
  $('kw-ok').addEventListener('click', closeSheet);
  $('kp-close').addEventListener('click', closeSheet);
  $('kp-form').addEventListener('submit', function(e){
    e.preventDefault();
    var f = this, err = $('kp-err');
    var title = f.title.value.trim(), by = f.by.value.trim(), url = f.url.value.trim(), why = f.why.value.trim();
    // The label on the card comes from the categories picked.
    var TYPEOF = { Books:'Book', Videos:'Video', Articles:'Article', Podcasts:'Podcast', Music:'Music', Stories:'Story' }, type = 'Link';
    for (var ti = 0; ti < picked.length; ti++) if (TYPEOF[picked[ti]]){ type = TYPEOF[picked[ti]]; break; }
    var who = f.who.value;
    if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
    url = url.replace(/^http:\/\//i, 'https://');
    var bad = !title ? 'Add a title.' : !picked.length ? 'Pick at least one category.' :
      why.length < 10 ? 'Add a line about why it helped.' : (url && !/^https:\/\/[^\s.]+\.[^\s]+$/.test(url)) ? 'That link doesn’t look right.' : '';
    if (bad){ err.textContent = bad; return; }
    err.textContent = '';
    var send = $('kp-send'); send.disabled = true;
    var nick = who === 'nick' && window.OptionalApp && OptionalApp.nick ? OptionalApp.nick() : '';
    OptionalAccount.addPin({ title:title, by:by, type:type, url:url, cats:picked.slice(), why:why, nickname:nick }).then(function(){
      send.disabled = false; closeSheet(); plainToast('Thanks! One of us will take a look before it goes up.');
    }, function(){ send.disabled = false; err.textContent = 'Couldn’t send it just now. Try again in a bit.'; });
  });

  // "About these picks" note: pops up the first time, and the link under the title reopens it.
  function openAbout(){ openSheet($('ka-scrim'), $('ka-title')); }
  $('ka-ok').addEventListener('click', closeSheet);
  $('k-about').addEventListener('click', openAbout);
  window.OptionalKnow = { show:function(){
    if (!started){ started = true; draw(); loadComm(); }
    var seen = ''; try { seen = localStorage.getItem('optional-know-about') || ''; } catch (e){}
    if (!seen){ try { localStorage.setItem('optional-know-about', '1'); } catch (e){} setTimeout(openAbout, 350); }
  } };
})();
