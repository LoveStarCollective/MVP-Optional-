// =========================================================
// OPTIONAL — page behavior
// Screens are <section> elements. One shows at a time.
// Accounts and encryption live in account.js (window.OptionalAccount).
// =========================================================
(function(){
  var screens = ['welcome','meet','you','signup','key','more','done','login'];
  var needsLogin = ['key','more','done'];   // screens only a logged-in person can see

  var friendName = 'Bestie';   // what the user named their Optional Friend
  var nickname = '';           // what the app calls the user
  var picked = '';             // what they chose on the "more of" page
  var Account = window.OptionalAccount;

  function $(id){ return document.getElementById(id); }

  // ---------- moving between screens ----------
  function show(id, moveFocus){
    if (screens.indexOf(id) === -1){ id = 'welcome'; }
    if (needsLogin.indexOf(id) !== -1 && !Account.isLoggedIn()){ id = 'welcome'; }
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

  // ---------- names ----------
  function setFriend(name){
    friendName = name || 'Bestie';
    var spots = document.querySelectorAll('.who');
    for (var i = 0; i < spots.length; i++){ spots[i].textContent = friendName; }
  }

  function setNickname(name){
    nickname = name || '';
    var spots = document.querySelectorAll('.me');
    for (var i = 0; i < spots.length; i++){ spots[i].textContent = nickname ? ', ' + nickname : ''; }
  }

  // ---------- form helpers ----------
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

  // Show a button as working, so nobody taps twice.
  function setBusy(button, busy, busyText){
    if (busy){
      button.setAttribute('data-label', button.textContent);
      button.textContent = busyText;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
    } else {
      button.textContent = button.getAttribute('data-label') || button.textContent;
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  }

  function showRecoveryKey(key){
    $('key-text').textContent = key;
    $('key-saved').checked = false;
    $('copy-status').textContent = '';
    setError(null, 'key-err', '');
    go('key');
  }

  // ---------- plain navigation buttons ----------
  var buttons = document.querySelectorAll('[data-go]');
  for (var b = 0; b < buttons.length; b++){
    buttons[b].addEventListener('click', function(){ go(this.getAttribute('data-go')); });
  }

  // ---------- show / hide password ----------
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

  // ---------- name the Friend ----------
  $('name-form').addEventListener('submit', function(event){
    event.preventDefault();
    setFriend($('cheer-name').value.trim());
    go('you');
  });
  $('skip-intro').addEventListener('click', function(){
    setFriend('');
    setNickname('');
    go('signup');
  });

  // ---------- your name ----------
  $('you-form').addEventListener('submit', function(event){
    event.preventDefault();
    setNickname($('user-name').value.trim());
    go('signup');
  });
  $('skip-you').addEventListener('click', function(){
    setNickname('');
    go('signup');
  });

  // ---------- create account ----------
  $('signup-form').addEventListener('submit', function(event){
    event.preventDefault();
    var email = $('su-email').value.trim();
    var pass = $('su-pass').value;
    var emailOk = looksLikeEmail(email);
    var passOk = pass.length >= 10;
    setError('su-email', 'su-email-err', emailOk ? '' : 'Enter your email address, like name@example.com.');
    setError('su-pass', 'su-pass-err', passOk ? '' : 'Your password needs at least 10 characters.');
    setError(null, 'su-form-err', '');
    if (!emailOk){ $('su-email').focus(); return; }
    if (!passOk){ $('su-pass').focus(); return; }

    var button = this.querySelector('.btn');
    setBusy(button, true, 'Creating your account…');
    Account.signUp(email, pass, { friend: friendName, nick: nickname }).then(function(result){
      setBusy(button, false);
      $('su-pass').value = '';
      if (result.needsConfirm){
        setError(null, 'su-form-err', 'Check your email for a confirmation link, then log in.');
        return;
      }
      showRecoveryKey(result.recoveryKey);
    }, function(error){
      setBusy(button, false);
      setError(null, 'su-form-err', error.message);
    });
  });

  // ---------- recovery key ----------
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
    $('key-text').textContent = '----';
    picked = '';
    $('jot').value = '';
    go('more');
  });

  // ---------- what would you like more of ----------
  function finish(){
    $('picked').textContent = picked || 'nothing yet';
    go('done');
  }
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
  $('maybe-later').addEventListener('click', function(){ picked = ''; finish(); });

  // ---------- log in ----------
  $('login-form').addEventListener('submit', function(event){
    event.preventDefault();
    var email = $('li-email').value.trim();
    var pass = $('li-pass').value;
    if (!looksLikeEmail(email) || pass.length === 0){
      setError(null, 'li-err', 'Enter your email and password.');
      return;
    }
    setError(null, 'li-err', '');
    $('login-note').textContent = '';

    var button = this.querySelector('.btn');
    setBusy(button, true, 'Logging in…');
    Account.logIn(email, pass).then(function(result){
      setBusy(button, false);
      $('li-pass').value = '';
      setFriend(result.settings.friend || '');
      setNickname(result.settings.nick || '');
      if (result.recoveryKey){ showRecoveryKey(result.recoveryKey); }
      else { picked = ''; go('more'); }
    }, function(error){
      setBusy(button, false);
      setError(null, 'li-err', error.message);
    });
  });
  $('forgot').addEventListener('click', function(){
    $('login-note').textContent = 'Resetting a password with your recovery key is the next piece being built.';
  });

  // ---------- log out ----------
  $('logout').addEventListener('click', function(){
    Account.logOut().then(function(){
      setFriend('');
      setNickname('');
      $('cheer-name').value = '';
      $('user-name').value = '';
      $('su-email').value = '';
      $('li-email').value = '';
      go('welcome');
    });
  });

  // ---------- start ----------
  window.addEventListener('hashchange', function(){
    show(location.hash.replace('#','') || 'welcome', true);
  });
  show(location.hash.replace('#','') || 'welcome', false);
})();
