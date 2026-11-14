(function(){
  var screens = ['welcome','meet','you','more','signup','key','done','login'];
  var cheerName = 'Bestie';
  var picked = '';

  function $(id){ return document.getElementById(id); }

  function show(id, moveFocus){
    if (screens.indexOf(id) === -1){ id = 'welcome'; }
    for (var i = 0; i < screens.length; i++){
      $(screens[i]).hidden = (screens[i] !== id);
    }
    window.scrollTo(0, 0);
    if (moveFocus){
      var heading = document.querySelector('#' + id + ' h1');
      if (heading){ heading.setAttribute('tabindex', '-1'); heading.focus(); }
    }
  }

  function go(id){
    if (location.hash.replace('#','') === id){ show(id, true); }
    else { location.hash = id; }
  }

  function setName(name){
    cheerName = name || 'Bestie';
    var spots = document.querySelectorAll('.who');
    for (var i = 0; i < spots.length; i++){ spots[i].textContent = cheerName; }
  }

  function setMe(name){
    var spots = document.querySelectorAll('.me');
    for (var i = 0; i < spots.length; i++){ spots[i].textContent = name ? ', ' + name : ''; }
  }

  function setError(inputId, errId, message){
    var input = inputId ? $(inputId) : null;
    $(errId).textContent = message;
    if (input){
      if (message){ input.setAttribute('aria-invalid', 'true'); }
      else { input.removeAttribute('aria-invalid'); }
    }
  }

  function looksLikeEmail(value){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function makeKey(){
    var letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var values = new Uint8Array(24);
    (window.crypto || window.msCrypto).getRandomValues(values);
    var out = '';
    for (var i = 0; i < values.length; i++){
      if (i > 0 && i % 4 === 0){ out += ' '; }
      out += letters[values[i] % letters.length];
    }
    return out;
  }

  // plain navigation buttons
  var buttons = document.querySelectorAll('[data-go]');
  for (var b = 0; b < buttons.length; b++){
    buttons[b].addEventListener('click', function(){ go(this.getAttribute('data-go')); });
  }

  // show / hide password
  var toggles = document.querySelectorAll('[data-toggle]');
  for (var t = 0; t < toggles.length; t++){
    toggles[t].addEventListener('click', function(){
      var input = $(this.getAttribute('data-toggle'));
      var showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      this.textContent = showing ? 'Show' : 'Hide';
      this.setAttribute('aria-pressed', showing ? 'false' : 'true');
    });
  }

  // page 2: name the Friend
  $('name-form').addEventListener('submit', function(event){
    event.preventDefault();
    setName($('cheer-name').value.trim());
    go('you');
  });
  $('skip-intro').addEventListener('click', function(){
    setName('');
    setMe('');
    go('signup');
  });

  // your name
  $('you-form').addEventListener('submit', function(event){
    event.preventDefault();
    setMe($('user-name').value.trim());
    go('signup');
  });
  $('skip-you').addEventListener('click', function(){
    setMe('');
    go('signup');
  });

  // what would you like more of
  var choices = document.querySelectorAll('.choice');
  for (var c = 0; c < choices.length; c++){
    choices[c].addEventListener('click', function(){
      picked = this.getAttribute('data-more');
      finish();
    });
  }
  $('jot-form').addEventListener('submit', function(event){
    event.preventDefault();
    var text = $('jot').value.trim();
    if (text){ picked = text; }
    finish();
  });

  function finish(){
    $('picked').textContent = picked || 'nothing yet';
    go('done');
  }
  $('maybe-later').addEventListener('click', function(){ picked = ''; finish(); });

  // create account
  $('signup-form').addEventListener('submit', function(event){
    event.preventDefault();
    var email = $('su-email').value.trim();
    var pass = $('su-pass').value;
    var emailOk = looksLikeEmail(email);
    var passOk = pass.length >= 10;
    setError('su-email', 'su-email-err', emailOk ? '' : 'Enter your email address, like name@example.com.');
    setError('su-pass', 'su-pass-err', passOk ? '' : 'Your password needs at least 10 characters.');
    if (!emailOk){ $('su-email').focus(); return; }
    if (!passOk){ $('su-pass').focus(); return; }
    $('key-text').textContent = makeKey();
    $('key-saved').checked = false;
    $('copy-status').textContent = '';
    setError(null, 'key-err', '');
    go('key');
  });

  // page 4b: recovery key
  $('copy-key').addEventListener('click', function(){
    var status = $('copy-status');
    var text = $('key-text').textContent;
    try {
      navigator.clipboard.writeText(text).then(function(){
        status.textContent = 'Copied.';
      }, function(){
        status.textContent = 'Copy is blocked here. Please write the key down.';
      });
    } catch (err){
      status.textContent = 'Copy is blocked here. Please write the key down.';
    }
  });
  $('key-form').addEventListener('submit', function(event){
    event.preventDefault();
    if (!$('key-saved').checked){
      setError(null, 'key-err', 'Tick the box once you have saved your key.');
      $('key-saved').focus();
      return;
    }
    picked = '';
    $('jot').value = '';
    go('more');
  });

  // log in (preview)
  $('login-form').addEventListener('submit', function(event){
    event.preventDefault();
    var ok = looksLikeEmail($('li-email').value.trim()) && $('li-pass').value.length > 0;
    setError(null, 'li-err', ok ? '' : 'Enter your email and password.');
    if (ok){ $('login-note').textContent = 'That is all the preview does. Real log in arrives with Supabase.'; }
  });
  $('forgot').addEventListener('click', function(){
    $('login-note').textContent = 'The recovery key screen for forgotten passwords gets built with Supabase.';
  });

  window.addEventListener('hashchange', function(){
    show(location.hash.replace('#','') || 'welcome', true);
  });

  var start = location.hash.replace('#','') || 'welcome';
  if (start === 'key' || start === 'more' || start === 'done'){ start = 'welcome'; }
  show(start, false);
})();
