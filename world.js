// ===== Out in the World (preview) =====
// Places come live from OpenStreetMap around the map. Shared posts are a preview here;
// later they live in Supabase, checked against Optional's rules before they show up.
(function(){
  function $(id){ return document.getElementById(id); }

  // ---------- types ----------
  var VENUES = [
    { key:'parks',     label:'Parks & trails',     cost:'Free', setting:'Outdoor' },
    { key:'libraries', label:'Libraries',          cost:'Free', setting:'Indoor'  },
    { key:'museums',   label:'Museums & art',      cost:'$',    setting:'Indoor'  },
    { key:'community', label:'Community centers',  cost:'Free', setting:'Indoor'  },
    { key:'fitness',   label:'Gyms & yoga',        cost:'$$',   setting:'Indoor', tag:'Sport & exercise' },
    { key:'sports',    label:'Sports fields & courts', cost:'Free', setting:'Outdoor', tag:'Sport & exercise' },
    { key:'pools',     label:'Pools',              cost:'$',    setting:'Indoor', tag:'Sport & exercise' },
    { key:'markets',   label:'Markets',            cost:'$',    setting:'Outdoor', tag:'Food' },
    { key:'gardens',   label:'Gardens & nature',   cost:'Free', setting:'Outdoor' },
    { key:'spiritual', label:'Places of worship',  cost:'Free', setting:'Indoor'  }
  ];
  var ACTIVITIES = [
    { key:'music',     label:'Live music' },
    { key:'sportsev',  label:'Sports & games' },
    { key:'festivals', label:'Festivals' },
    { key:'fairs',     label:'Markets & fairs' },
    { key:'classes',   label:'Classes & workshops' },
    { key:'art',       label:'Art & creative' },
    { key:'outdoors',  label:'Outdoors & nature' },
    { key:'wellness',  label:'Movement & wellness' },
    { key:'volunteer', label:'Volunteering' },
    { key:'niche',     label:'Niche & hobbies' },
    { key:'pets',      label:'Pet caf\u00e9s & animals' },
    { key:'support',   label:'Support groups' },
    { key:'meetup',    label:'Meetups' }
  ];
  var DETAILS = [
    { group:'When',         key:'when', multi:false, items:['Happening now','Today','This week'] },
    { group:'Cost',         key:'cost', multi:true,  items:['Free','$','$$','$$$'] },
    { group:'Setting',      key:'set',  multi:true,  items:['Indoor','Outdoor'] },
    { group:'Good to know', key:'good', multi:true,  items:['Solo-friendly','Family-friendly','Pet-friendly','Alcohol-free','Wheelchair accessible'] },
    { group:'Distance',     key:'dist', multi:false, items:['Within 1 mile','Within 5 miles','Within 10 miles'] }
  ];
  // What's happening: picked from a list, so posts stay on track. "Other" gets a closer check.
  var WHAT = {
    music:     ['Concert','Live band','Open mic','Jazz night','Choir or singalong'],
    sportsev:  ['Pickup game','Run or walk club','Tournament','Board game night','Trivia night'],
    festivals: ['Street festival','Cultural festival','Food festival','Film festival','Parade'],
    fairs:     ['Farmers market','Night market','Craft fair','Flea market','Book sale'],
    classes:   ['Art class','Dance class','Cooking class','Language exchange','Talk or lecture','Workshop'],
    art:       ['Gallery opening','Open studio','Poetry reading','Film screening','Theater or comedy show'],
    outdoors:  ['Group hike','Nature walk','Park cleanup','Stargazing','Birdwatching'],
    wellness:  ['Yoga','Meditation','Tai chi','Walking group','Stretch or mobility'],
    volunteer: ['Food bank','Neighborhood cleanup','Animal shelter','Community garden'],
    niche:     ['Chess','Board games','Knitting or crafts','Book club','Puzzle swap'],
    pets:      ['Cat caf\u00e9','Dog caf\u00e9','Petting zoo','Shelter visit','Dog park meetup'],
    support:   ['Peer support meeting','Recovery meeting','Grief group'],
    meetup:    ['Walk and talk','Coffee meetup','Hobby meetup','Newcomers meetup']
  };
  var AUTO_TAG = { 'Food festival':'Food', 'Cooking class':'Food', 'Pickup game':'Sport & exercise', 'Run or walk club':'Sport & exercise', 'Tournament':'Sport & exercise',
    'Group hike':'Sport & exercise', 'Yoga':'Sport & exercise', 'Tai chi':'Sport & exercise', 'Walking group':'Sport & exercise', 'Stretch or mobility':'Sport & exercise', 'Dance class':'Sport & exercise' };
  function typeLabel(k){ var all = VENUES.concat(ACTIVITIES); for (var i = 0; i < all.length; i++) if (all[i].key === k) return all[i].label; return k; }
  function venueInfo(k){ for (var i = 0; i < VENUES.length; i++) if (VENUES[i].key === k) return VENUES[i]; return {}; }

  // ---------- state ----------
  var places = [];   // live venues
  var posts = [];    // shared by people
  var picks = { types:[], when:[], cost:[], set:[], good:[], dist:[] };
  var draft = null;  // filters while the sheet is open
  var hidden = [];
  try { hidden = JSON.parse(localStorage.getItem('optional-world-hidden') || '[]'); } catch (e){}
  function saveHidden(){ try { localStorage.setItem('optional-world-hidden', JSON.stringify(hidden)); } catch (e){} }
  var you = null, selected = null, map = null, layer = null, youMarker = null;
  var START = { lat:40.7359, lng:-73.9911, zoom:13 };   // New York, the practice area

  // ---------- sample posts (preview only) ----------
  function at(hoursFromNow){ var d = new Date(Date.now() + hoursFromNow * 3600000); return d.toISOString(); }
  posts = [
    { id:'p1', type:'classes', name:'Free salsa class, all levels', where:'Bryant Park lawn', lat:40.7536, lng:-73.9832, start:at(2), cost:'Free', tags:['Outdoor','Solo-friendly','Family-friendly','Alcohol-free','Sport & exercise'], ago:'25 min ago', still:4 },
    { id:'p2', type:'music', name:'Jazz trio, no cover tonight', where:'Smalls, W 10th St', lat:40.7344, lng:-74.0027, start:at(5), cost:'Free', tags:['Indoor','Solo-friendly'], ago:'1 hr ago', still:2 },
    { id:'p3', type:'meetup', name:'Pickup soccer, bring water', where:'East River Park fields', lat:40.7155, lng:-73.9757, start:at(20), cost:'Free', tags:['Outdoor','Alcohol-free','Sport & exercise'], ago:'3 hr ago', still:1 },
    { id:'p4', type:'fairs', name:'Night market with local makers', where:'Union Square north plaza', lat:40.7368, lng:-73.9906, start:at(-1), cost:'$', tags:['Outdoor','Family-friendly','Wheelchair accessible','Food'], ago:'40 min ago', still:7 },
    { id:'p5', type:'niche', name:'Chess in the park, boards provided', where:'Washington Square Park', lat:40.7308, lng:-73.9973, start:at(0.5), cost:'Free', tags:['Outdoor','Solo-friendly','Alcohol-free'], ago:'10 min ago', still:3 }
  ];

  // Backup places if the live map data can't be reached
  var SAMPLE = [
    ['Central Park','parks',40.7829,-73.9654],['Bryant Park','parks',40.7536,-73.9832],['New York Public Library','libraries',40.7532,-73.9822],
    ['The High Line','parks',40.7480,-74.0048],['Washington Square Park','parks',40.7308,-73.9973],['Union Square Greenmarket','markets',40.7359,-73.9911],
    ['Brooklyn Bridge Park','parks',40.7003,-73.9967],['Brooklyn Public Library','libraries',40.6722,-73.9682],['The Met','museums',40.7794,-73.9632],
    ['Asser Levy Pool','pools',40.7363,-73.9757],['Tompkins Square Park','parks',40.7265,-73.9815],['Chelsea Recreation Center','community',40.7461,-74.0004]
  ].map(function(r, i){ var v = venueInfo(r[1]); return { id:'s' + i, type:r[1], name:r[0], lat:r[2], lng:r[3], cost:v.cost, tags:[v.setting].concat(v.tag ? [v.tag] : []) }; });

  // ---------- distance (worked out on the phone) ----------
  function miles(a, b){ var rad = Math.PI/180, R = 3958.8, dLat = (b.lat-a.lat)*rad, dLng = (b.lng-a.lng)*rad;
    var h = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLng/2)*Math.sin(dLng/2); return 2*R*Math.asin(Math.sqrt(h)); }
  function here(){ if (you) return you; if (map){ var c = map.getCenter(); return { lat:c.lat, lng:c.lng }; } return START; }

  // ---------- live places from OpenStreetMap ----------
  function classify(t){
    if (t.leisure === 'park' || t.leisure === 'nature_reserve' || t.route === 'hiking') return 'parks';
    if (t.amenity === 'library') return 'libraries';
    if (t.tourism === 'museum' || t.tourism === 'gallery' || t.amenity === 'arts_centre') return 'museums';
    if (t.amenity === 'community_centre') return 'community';
    if (t.leisure === 'fitness_centre' || t.leisure === 'sports_centre') return 'fitness';
    if (t.leisure === 'pitch' || t.leisure === 'track') return 'sports';
    if (t.leisure === 'swimming_pool' || t.leisure === 'water_park') return 'pools';
    if (t.amenity === 'marketplace') return 'markets';
    if (t.leisure === 'garden') return 'gardens';
    if (t.amenity === 'place_of_worship') return 'spiritual';
    return null;
  }
  function loadPlaces(){
    if (!map) { places = SAMPLE; render(); return; }
    var b = map.getBounds(), bb = [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()].map(function(n){ return n.toFixed(4); }).join(',');
    var q = '[out:json][timeout:20];(' +
      'nwr["leisure"~"^(park|nature_reserve|fitness_centre|sports_centre|swimming_pool|garden)$"]["name"](' + bb + ');' +
      'nwr["amenity"~"^(library|arts_centre|community_centre|marketplace|place_of_worship)$"]["name"](' + bb + ');' +
      'nwr["tourism"~"^(museum|gallery)$"]["name"](' + bb + ');' +
      ');out center 120;';
    $('w-status').textContent = 'Finding places…';
    fetch('https://overpass-api.de/api/interpreter', { method:'POST', body:'data=' + encodeURIComponent(q) })
      .then(function(r){ if (!r.ok) throw new Error('bad'); return r.json(); })
      .then(function(data){
        var out = [], seen = {};
        (data.elements || []).forEach(function(e){
          var t = e.tags || {}, type = classify(t); if (!type || !t.name) return;
          var lat = e.lat || (e.center && e.center.lat), lng = e.lon || (e.center && e.center.lon); if (!lat) return;
          var k = t.name + type; if (seen[k]) return; seen[k] = 1;
          var v = venueInfo(type), tags = [v.setting]; if (v.tag) tags.push(v.tag);
          if (t.wheelchair === 'yes') tags.push('Wheelchair accessible');
          var cost = t.fee === 'no' ? 'Free' : (t.fee === 'yes' ? '$' : v.cost);
          out.push({ id:'o' + e.id, type:type, name:t.name, lat:lat, lng:lng, cost:cost, tags:tags,
            where:[t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ') });
        });
        places = out.length ? out : SAMPLE;
        $('w-status').textContent = out.length ? '' : 'Showing a few sample places for now.';
        render();
      })
      .catch(function(){ places = SAMPLE; $('w-status').textContent = 'Couldn’t reach the live map data, so here are a few sample places.'; render(); });
  }

  // ---------- filtering ----------
  function whenOK(p){
    if (!picks.when.length) return true;
    if (!p.start) return false;   // places have no times; when-filters show shared events
    var s = new Date(p.start).getTime(), now = Date.now(), w = picks.when[0];
    if (w === 'Happening now') return s <= now && now - s < 3 * 3600000;
    if (w === 'Today') return new Date(p.start).toDateString() === new Date().toDateString();
    return s - now < 7 * 86400000 && now - s < 3 * 3600000;
  }
  function anyOf(list, val){ return !list.length || list.indexOf(val) !== -1; }
  function allIn(list, tags){ for (var i = 0; i < list.length; i++) if (tags.indexOf(list[i]) === -1) return false; return true; }
  function visible(){
    var c = here(), maxd = picks.dist.length ? parseFloat(picks.dist[0].replace(/\D+/g, ' ')) : null;
    return posts.concat(places).filter(function(p){
      if (hidden.indexOf(p.type) !== -1) return false;
      for (var hi = 0; hi < p.tags.length; hi++) if (hidden.indexOf(p.tags[hi]) !== -1) return false;
      if (picks.types.length && picks.types.indexOf(p.type) === -1) return false;
      if (!whenOK(p)) return false;
      if (!anyOf(picks.cost, p.cost)) return false;
      if (picks.set.length && !p.tags.some(function(t){ return picks.set.indexOf(t) !== -1; })) return false;
      if (!allIn(picks.good, p.tags)) return false;
      p._d = miles(c, p);
      if (maxd && p._d > maxd) return false;
      return true;
    }).sort(function(a, b){ if (!!a.start !== !!b.start) return a.start ? -1 : 1; return a._d - b._d; });
  }
  function activeCount(){ var n = 0; for (var k in picks) n += picks[k].length; return n; }

  // ---------- render ----------
  function timeText(p){
    var d = new Date(p.start), now = Date.now(), s = d.getTime();
    var t = d.toLocaleTimeString([], { hour:'numeric', minute:'2-digit' });
    if (s <= now) return 'Happening now';
    if (d.toDateString() === new Date().toDateString()) return 'Today, ' + t;
    return d.toLocaleDateString([], { weekday:'short' }) + ', ' + t;
  }
  function render(){
    var list = $('w-list'), items = visible().slice(0, 60);
    list.innerHTML = '';
    $('w-count').textContent = items.length ? items.length + ' nearby' : 'Nearby';
    var n = activeCount(); $('w-fcount').hidden = !n; $('w-fcount').textContent = n;
    if (!items.length){ var li = document.createElement('li'); li.className = 'wempty'; li.textContent = 'Nothing matches yet. Try fewer filters, or share something.'; list.appendChild(li); }
    items.forEach(function(p){
      var li = document.createElement('li'); li.className = 'witem tear' + (items.indexOf(p) % 5) + (p.start ? ' post' : '') + (selected === p.id ? ' on' : '');
      var meta = [p.where, p._d != null ? (p._d < 0.1 ? 'Right here' : p._d.toFixed(1) + ' mi') : ''].filter(Boolean).join(' · ');
      var html = '<button type="button" class="wname">' + esc(p.name) + '</button>';
      if (p.kind && p.kind !== p.name) html += '<p class="wmeta">' + esc(p.kind) + '</p>';
      if (p.start) html += '<p class="wmeta"><strong>' + timeText(p) + '</strong></p>';
      if (meta) html += '<p class="wmeta">' + esc(meta) + '</p>';
      html += '<div class="wtags"><span class="wtag type">' + esc(typeLabel(p.type)) + '</span><span class="wtag">' + esc(p.price || p.cost) + '</span>' +
        p.tags.map(function(t){ return '<span class="wtag">' + esc(t) + '</span>'; }).join('') + '</div>';
      if (p.type === 'meetup') html += '<p class="wdisc">Meetups are at your own risk. Meet in public and look out for yourself.</p>';
      if (p.start) html += '<div class="wpostfoot"><span>Shared anonymously · ' + esc(p.ago || 'just now') + ' · ' + p.still + ' say it’s on</span>' +
        '<span><button type="button" class="linkbtn w-still">Still on</button><button type="button" class="linkbtn w-report">Report</button></span></div>';
      li.innerHTML = html;
      li.querySelector('.wname').addEventListener('click', function(){ pick(p, true); });
      var st = li.querySelector('.w-still'); if (st) st.addEventListener('click', function(){ p.still++; toast('Thanks for checking.'); render(); });
      var rp = li.querySelector('.w-report'); if (rp) rp.addEventListener('click', function(){ posts = posts.filter(function(x){ return x !== p; }); toast('Thanks. We’ve hidden it while we take a look.'); render(); });
      list.appendChild(li);
    });
    drawPins(items);
  }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function drawPins(items){
    if (!map || !window.L) return;
    if (layer) layer.clearLayers(); else layer = L.layerGroup().addTo(map);
    items.forEach(function(p){
      var m = L.marker([p.lat, p.lng], { icon:L.divIcon({ className:'', html:'<div class="wpin' + (p.start ? ' post' : '') + (selected === p.id ? ' on' : '') + '"></div>', iconSize:[18, 18], iconAnchor:[9, 9] }), title:p.name, keyboard:false });
      m.on('click', function(){ pick(p, false); });
      m.addTo(layer);
    });
  }
  function pick(p, pan){
    selected = p.id; render();
    if (pan && map) map.setView([p.lat, p.lng], Math.max(map.getZoom(), 15));
    var on = document.querySelector('.witem.on'); if (on && !pan){ var l = $('w-list'); l.scrollTop = on.offsetTop - l.offsetTop - 8; }
  }

  // ---------- toast ----------
  var tt = null;
  function toast(msg, undo){ var t = $('w-toast'); t.textContent = msg; t.hidden = false;
    if (undo){ var u = document.createElement('button'); u.type = 'button'; u.className = 'wundo'; u.textContent = 'Undo';
      u.addEventListener('click', function(){ var i = hidden.indexOf(lastHidden); if (i !== -1){ hidden.splice(i, 1); saveHidden(); } t.hidden = true; if (!$('f-scrim').hidden) drawFilters(); else render(); });
      t.appendChild(document.createTextNode(' ')); t.appendChild(u); } t.classList.remove('fade'); clearTimeout(tt); tt = setTimeout(function(){ t.classList.add('fade'); tt = setTimeout(function(){ t.hidden = true; }, 400); }, 3200); }

  // ---------- filters sheet ----------
  function chip(label, on, onTap){ var b = document.createElement('button'); b.type = 'button'; b.className = 'wchip'; b.textContent = label; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.addEventListener('click', onTap); return b; }
  // The same closed eyelids used to hide things everywhere else in Optional.
  var LIDS = '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5c2.4 3.2 5.4 4.8 9 4.8s6.6-1.6 9-4.8"/><path d="M5.6 13.4l-1.6 2.2"/><path d="M9.6 15l-.6 2.7"/><path d="M14.4 15l.6 2.7"/><path d="M18.4 13.4l1.6 2.2"/></svg>';
  var lastHidden = null;
  function hideIt(key, label){
    hidden.push(key); saveHidden(); lastHidden = key;
    for (var k in draft){ var i = draft[k].indexOf(key); if (i !== -1) draft[k].splice(i, 1); }
    toast(label + ' hidden.', true);
    drawFilters();
  }
  function hideRow(key, label, on, onTap){
    var row = document.createElement('div'); row.className = 'ftype';
    row.appendChild(chip(label, on, onTap));
    var lid = document.createElement('button'); lid.type = 'button'; lid.className = 'feye'; lid.innerHTML = LIDS;
    lid.setAttribute('aria-label', 'Hide ' + label);
    lid.addEventListener('click', function(){ hideIt(key, label); });
    row.appendChild(lid); return row;
  }
  function typeGroup(title, list){
    var shown = list.filter(function(t){ return hidden.indexOf(t.key) === -1; });
    var fs = document.createElement('fieldset'); fs.className = 'fgroup';
    fs.innerHTML = '<legend>' + title + '</legend>';
    var wrap = document.createElement('div'); wrap.className = 'ftypes';
    shown.forEach(function(t){
      wrap.appendChild(hideRow(t.key, t.label, draft.types.indexOf(t.key) !== -1, function(){
        var i = draft.types.indexOf(t.key); if (i === -1) draft.types.push(t.key); else draft.types.splice(i, 1); drawFilters();
      }));
    });
    fs.appendChild(wrap); return fs;
  }
  function drawFilters(){
    var g = $('f-groups'); g.innerHTML = '';
    g.appendChild(typeGroup('Places', VENUES));
    g.appendChild(typeGroup('Things to do', ACTIVITIES));
    DETAILS.forEach(function(d){
      var fs = document.createElement('fieldset'); fs.className = 'fgroup'; fs.innerHTML = '<legend>' + d.group + '</legend>';
      var w = document.createElement('div'); w.className = 'wchips'; var w2 = document.createElement('div'); w2.className = 'ftypes';
      d.items.forEach(function(it){
        var canHide = d.hideable && d.hideable.indexOf(it) !== -1;
        if (canHide && hidden.indexOf(it) !== -1) return;
        var tap = function(){
          var arr = draft[d.key], i = arr.indexOf(it);
          if (i !== -1) arr.splice(i, 1); else { if (!d.multi) arr.length = 0; arr.push(it); }
          drawFilters();
        };
        if (canHide) w2.appendChild(hideRow(it, it, draft[d.key].indexOf(it) !== -1, tap)); else w.appendChild(chip(it, draft[d.key].indexOf(it) !== -1, tap));
      });
      fs.appendChild(w); if (w2.children.length){ w2.style.marginTop = '0.5rem'; fs.appendChild(w2); } g.appendChild(fs);
    });
    // Hidden items: a box that opens to show each hidden thing, brought back one at a time.
    var box = $('f-hidden'), list = $('f-hidlist');
    box.hidden = !hidden.length;
    $('f-hidcount').textContent = hidden.length ? '(' + hidden.length + ')' : '';
    list.innerHTML = '';
    hidden.forEach(function(k){
      var li = document.createElement('li');
      li.innerHTML = '<span>' + esc(typeLabel(k)) + '</span>';
      var bb = document.createElement('button'); bb.type = 'button'; bb.className = 'linkbtn'; bb.textContent = 'Bring back';
      bb.setAttribute('aria-label', 'Bring back ' + typeLabel(k));
      bb.addEventListener('click', function(){ var i = hidden.indexOf(k); if (i !== -1){ hidden.splice(i, 1); saveHidden(); } drawFilters(); var t = $('f-hidtoggle'); if (!box.hidden) t.focus(); });
      li.appendChild(bb); list.appendChild(li);
    });
  }
  $('f-hidtoggle').addEventListener('click', function(){
    var open = this.getAttribute('aria-expanded') !== 'true';
    this.setAttribute('aria-expanded', open ? 'true' : 'false'); $('f-hidlist').hidden = !open;
  });
  function openSheet(id){ $(id).hidden = false; document.body.style.overflow = 'hidden'; var h = $(id).querySelector('h2'); if (h){ h.setAttribute('tabindex', '-1'); h.focus(); } }
  function closeSheet(id, back){ $(id).hidden = true; document.body.style.overflow = ''; if (back) $(back).focus(); }
  $('w-filter').addEventListener('click', function(){ draft = JSON.parse(JSON.stringify(picks)); drawFilters(); openSheet('f-scrim'); });
  $('f-close').addEventListener('click', function(){ closeSheet('f-scrim', 'w-filter'); render(); });
  $('f-apply').addEventListener('click', function(){ picks = draft; closeSheet('f-scrim', 'w-filter'); render(); });
  $('f-clear').addEventListener('click', function(){ for (var k in draft) draft[k] = []; drawFilters(); });

  // ---------- share something ----------
  var sel = $('s-type'), what = $('s-what');
  sel.innerHTML = '<option value="">Pick one</option>' + ACTIVITIES.map(function(a){ return '<option value="' + a.key + '">' + a.label + '</option>'; }).join('');
  sel.addEventListener('change', function(){
    $('s-meetup').hidden = sel.value !== 'meetup';
    var opts = WHAT[sel.value] || [];
    $('s-whatwrap').hidden = !sel.value;
    what.innerHTML = '<option value="">Pick one</option>' + opts.map(function(o){ return '<option>' + o + '</option>'; }).join('') + '<option value="__other">Other</option>';
    $('s-otherwrap').hidden = true;
  });
  what.addEventListener('change', function(){ $('s-otherwrap').hidden = what.value !== '__other'; });
  // Things that can't be the main point of a post. Always blocked, whatever the AI check says.
  var NOPE = /\b(wine|whiskey|whisky|bourbon|tequila|vodka|beers?|brew(ery|eries|pub)?|cocktails?|happy hour|bottomless|bar crawl|pub crawl|shots?|tasting|open bar|drinks? specials?|pints?|casino|poker|blackjack|roulette|betting|bets?|sportsbook|slots?|lottery|bingo for cash|cannabis|weed|420|dispensary|vape|hookah|cigars?)\b/i;
  $('s-form').addEventListener('submit', function(e){
    e.preventDefault();
    var err = $('s-err'), type = sel.value, w = what.value, other = $('s-name').value.trim(), title = $('s-headline').value.trim(),
        where = $('s-where').value.trim(), date = $('s-date').value, time = $('s-time').value, details = $('s-details').value;
    err.textContent = '';
    if (!type){ err.textContent = 'Pick what kind of thing it is.'; sel.focus(); return; }
    if (!w){ err.textContent = 'Pick what’s happening.'; what.focus(); return; }
    if (w === '__other' && !other){ err.textContent = 'Tell people what it is.'; $('s-name').focus(); return; }
    if (!where){ err.textContent = 'Add where it is.'; $('s-where').focus(); return; }
    if (!date || !time){ err.textContent = 'Add the day and time it starts.'; (date ? $('s-time') : $('s-date')).focus(); return; }
    if (type === 'meetup' && !$('s-meetok').checked){ err.textContent = 'Tick “Got it” for meetups.'; $('s-meetok').focus(); return; }
    if (NOPE.test([other, title, details].join(' '))){ err.textContent = 'This one’s centered on something Optional keeps clear of, like drinking or betting. If something else is happening there, like live music or a game night, share that instead.'; return; }
    var kind = w === '__other' ? other : w;
    var c = here(), cost = document.querySelector('input[name="s-cost"]:checked').value, price = $('s-price').value.trim();
    var tags = Array.prototype.map.call(document.querySelectorAll('#s-form .wfs input[type=checkbox]:checked'), function(i){ return i.value; });
    if (AUTO_TAG[kind] && tags.indexOf(AUTO_TAG[kind]) === -1) tags.push(AUTO_TAG[kind]);
    var p = { id:'n' + Date.now(), type:type, name:title || kind, kind:kind, where:where, lat:c.lat, lng:c.lng, start:new Date(date + 'T' + time).toISOString(), cost:cost, price:price || '', tags:tags, ago:'just now', still:0 };
    posts.unshift(p);
    $('s-form').reset(); $('s-meetup').hidden = true; $('s-otherwrap').hidden = true; $('s-whatwrap').hidden = true;
    closeSheet('s-scrim', 'w-share'); selected = p.id; render();
    toast('Shared. Thanks for putting it out there.');
  });
  $('w-share').addEventListener('click', function(){ openSheet('s-scrim'); });
  $('s-close').addEventListener('click', function(){ closeSheet('s-scrim', 'w-share'); });
  document.addEventListener('keydown', function(e){ if (e.key !== 'Escape') return; if (!$('f-scrim').hidden) closeSheet('f-scrim', 'w-filter'); if (!$('s-scrim').hidden) closeSheet('s-scrim', 'w-share'); });

  // ---------- location (stays on the phone) ----------
  $('w-locate').addEventListener('click', function(){
    if (!navigator.geolocation){ toast('This phone can’t share its location.'); return; }
    $('w-status').textContent = 'Finding you…';
    navigator.geolocation.getCurrentPosition(function(pos){
      you = { lat:pos.coords.latitude, lng:pos.coords.longitude }; $('w-status').textContent = '';
      if (map){ map.setView([you.lat, you.lng], 14);
        if (youMarker) youMarker.setLatLng([you.lat, you.lng]); else youMarker = L.marker([you.lat, you.lng], { icon:L.divIcon({ className:'', html:'<div class="wyou"></div>', iconSize:[16,16], iconAnchor:[8,8] }), title:'You', keyboard:false }).addTo(map);
        loadPlaces(); } else render();
    }, function(){ $('w-status').textContent = 'No location, no problem. Move the map to explore.'; }, { enableHighAccuracy:false, timeout:10000 });
  });

  // ---------- map ----------
  function startMap(){
    if (!window.L){ $('w-status').textContent = 'The map couldn’t load here. The list still works.'; places = SAMPLE; render(); return; }
    map = L.map('w-map', { zoomControl:true, attributionControl:true }).setView([START.lat, START.lng], START.zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    map.on('dragend zoomend', function(){ $('w-search').hidden = false; });
    $('w-search').addEventListener('click', function(){ $('w-search').hidden = true; loadPlaces(); });
    loadPlaces();
  }
  var started = false;
  window.OptionalWorld = { show:function(){
    if (!started){ started = true; render(); startMap(); }
    else if (map){ setTimeout(function(){ map.invalidateSize(); }, 50); }
  } };
})();
