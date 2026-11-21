// =========================================================
// OPTIONAL — page behavior
// Screens are <section> elements. One shows at a time.
// Accounts and encryption live in account.js (window.OptionalAccount).
// =========================================================
(function(){
  var screens = ['welcome','meet','you','signup','code','key','more','options','dash','help','login','forgot','reset','fresh'];
  var needsLogin = ['key','more','options','dash','help'];   // screens only a logged-in person can see
  var inApp = ['options','dash','help'];   // screens that show the companion bar

  var friendName = 'Bestie';   // what the user named their Optional Friend
  var nickname = '';           // what the app calls the user
  var picked = '';             // what they chose on the "more of" page
  var avatar = 'curly';        // the picture they chose on their page
  var codeMode = '';           // 'signup' or 'reset' while the email-code screen is in use
  var Account = window.OptionalAccount;

  function $(id){ return document.getElementById(id); }

  // ---------- moving between screens ----------
  function show(id, moveFocus){
    if (screens.indexOf(id) === -1){ id = 'welcome'; }
    if (needsLogin.indexOf(id) !== -1 && !Account.isLoggedIn()){ id = 'welcome'; }
    if (id === 'code' && !codeMode){ id = 'login'; }
    if ((id === 'reset' || id === 'fresh') && Account.resetStage() !== 'ready' && Account.resetStage() !== 'empty'){ id = 'forgot'; }
    if (id === 'reset' && Account.resetStage() === 'empty'){ id = 'fresh'; }
    for (var i = 0; i < screens.length; i++){
      $(screens[i]).hidden = (screens[i] !== id);
    }
    document.body.classList.toggle('in-app', inApp.indexOf(id) !== -1);
    document.body.classList.toggle('on-dash', id === 'dash');
    if (window.OptionalInApp){ window.OptionalInApp.onShow(id); }
    if (window.OptionalDash){ window.OptionalDash.onShow(id); }
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
    var talk = $('talk');
    if (talk){ talk.placeholder = 'Talk to ' + friendName + '...'; $('talk-label').textContent = 'Talk to ' + friendName; }
  }

  function setNickname(name){
    nickname = name || '';
    var spots = document.querySelectorAll('.me');
    for (var i = 0; i < spots.length; i++){ spots[i].textContent = nickname ? ', ' + nickname : ''; }
    var plain = document.querySelectorAll('.nick-name');
    for (var j = 0; j < plain.length; j++){ plain[j].textContent = nickname || 'You'; }
    var hello = document.querySelectorAll('.hello-name');
    for (var k = 0; k < hello.length; k++){ hello[k].textContent = nickname ? ', ' + nickname : ''; }
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

  // The password rules, in one place. Returns '' when the password is fine.
  function passwordProblem(pass){
    if (pass.length < 10){ return 'Your password needs at least 10 characters.'; }
    if (pass.length > 72){ return 'Please keep your password to 72 characters or fewer.'; }
    return '';
  }
  var LEAKED = "That password has shown up in a data breach, so it isn't safe to use. Please choose a different one.";

  // Show a button as working, so nobody taps twice.
  function setBusy(button, busy, busyText){
    if (busy){
      if (!button.getAttribute('data-label')){ button.setAttribute('data-label', button.textContent); }
      button.textContent = busyText;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
    } else {
      button.textContent = button.getAttribute('data-label') || button.textContent;
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  }

  function showRecoveryKey(key, readyLine){
    extras = { friendLook: 'elephant', hidden: [] };
    if (window.OptionalDash){ window.OptionalDash.start(allSettings()); }
    $('key-ready').textContent = readyLine;
    $('key-text').textContent = key;
    $('key-saved').checked = false;
    $('copy-status').textContent = '';
    setError(null, 'key-err', '');
    go('key');
  }

  // "What would you like more of today?" shows once a day, the first time the app opens.
  function today(){ var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function openStart(){
    var seen = '';
    try { seen = localStorage.getItem('optional-more-day') || ''; } catch (e){}
    if (seen === today()){ go('options'); return; }
    try { localStorage.setItem('optional-more-day', today()); } catch (e){}
    picked = '';
    $('jot').value = '';
    go('more');
  }

  var extras = {};               // other saved settings: friendLook, hidden
  function enterApp(settings){
    settings = settings || {};
    setFriend(settings.friend || '');
    setNickname(settings.nick || '');
    avatar = settings.avatar || 'curly';
    extras = { friendLook: settings.friendLook || 'elephant', hidden: settings.hidden || [], reminders: settings.reminders || { times: [], auto: false }, lock: settings.lock || null };
    // The PIN is saved with the account, so it isn't lost if the browser clears its storage.
    if (window.OptionalLock && window.OptionalLock.load){ window.OptionalLock.load(settings.lock || null); }
    if (window.OptionalInApp){ window.OptionalInApp.setAvatar(avatar); }
    if (window.OptionalDash){ window.OptionalDash.start(settings); }
    openStart();
  }
  function allSettings(){ return { friend: friendName, nick: nickname, avatar: avatar, friendLook: extras.friendLook, hidden: extras.hidden, reminders: extras.reminders, lock: extras.lock || null }; }

  // Open the "check your email" screen for a sign-up or a password reset.
  function openCode(mode, email){
    codeMode = mode;
    $('code-email').textContent = email;
    $('code-input').value = '';
    setError('code-input', 'code-err', '');
    $('code-status').textContent = '';
    go('code');
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
    go('you');   // everyone still names themselves
  });

  // ---------- your name ----------
  // Tapping Let's go with no name gets a different suggestion each time, then loops.
  var NAME_IDEAS = [
    'Name yourself Dynamite if you\u2019d like.',
    'Or Sugar. Sugar works.',
    'How about Wednesday?',
    'Emperor has a nice ring to it.',
    'Captain? Captain is good.',
    'Moonbeam, maybe?',
    'Sir Naps-a-Lot is available.',
    'Okay, just Bob, then.'
  ];
  var nameTry = 0;
  $('you-form').addEventListener('submit', function(event){
    event.preventDefault();
    var name = $('user-name').value.trim();
    // Everyone gives themselves a name here, even a made-up one.
    if (!name){ setError('user-name', 'you-err', NAME_IDEAS[nameTry % NAME_IDEAS.length]); nameTry++; $('user-name').focus(); return; }
    setError('user-name', 'you-err', '');
    setNickname(name);
    go('signup');
  });

  // ---------- create account ----------
  $('signup-form').addEventListener('submit', function(event){
    event.preventDefault();
    var email = $('su-email').value.trim();
    var pass = $('su-pass').value;
    var emailOk = looksLikeEmail(email);
    var passError = passwordProblem(pass);
    setError('su-email', 'su-email-err', emailOk ? '' : 'Enter your email address, like name@example.com.');
    setError('su-pass', 'su-pass-err', passError);
    setError(null, 'su-form-err', '');
    if (!emailOk){ $('su-email').focus(); return; }
    if (passError){ $('su-pass').focus(); return; }

    var button = this.querySelector('button[type="submit"]');
    setBusy(button, true, 'Checking your password…');
    Account.isLeakedPassword(pass).then(function(leaked){
      if (leaked){
        setBusy(button, false);
        setError('su-pass', 'su-pass-err', LEAKED);
        $('su-pass').focus();
        return;
      }
      button.textContent = 'Creating your account…';
      return Account.signUp(email, pass, { friend: friendName, nick: nickname }).then(function(result){
        setBusy(button, false);
        $('su-pass').value = '';
        if (result.needsCode){ openCode('signup', result.email); return; }
        showRecoveryKey(result.recoveryKey, 'Your account is ready.');
      });
    }).catch(function(error){
      setBusy(button, false);
      setError(null, 'su-form-err', error.message);
    });
  });

  // ---------- the code from the email ----------
  $('code-form').addEventListener('submit', function(event){
    event.preventDefault();
    var code = $('code-input').value.replace(/\s/g, '');
    if (!/^\d{6,10}$/.test(code)){
      setError('code-input', 'code-err', 'Enter the code from the email. It is all numbers.');
      $('code-input').focus();
      return;
    }
    setError('code-input', 'code-err', '');
    var button = this.querySelector('button[type="submit"]');
    setBusy(button, true, 'Checking…');

    if (codeMode === 'reset'){
      Account.verifyResetCode(code).then(function(result){
        setBusy(button, false);
        codeMode = '';
        $('rs-key').value = ''; $('rs-pass').value = ''; $('fr-pass').value = ''; $('fr-sure').checked = false;
        go(result.hasEntries ? 'reset' : 'fresh');
      }, function(error){
        setBusy(button, false);
        setError('code-input', 'code-err', error.message);
      });
      return;
    }

    Account.confirmSignUp(code).then(function(result){
      setBusy(button, false);
      codeMode = '';
      if (result.recoveryKey){
        setFriend((result.settings && result.settings.friend) || friendName);
        setNickname((result.settings && result.settings.nick) || nickname);
        showRecoveryKey(result.recoveryKey, 'Your account is ready.');
      } else {
        enterApp(result.settings);
      }
    }, function(error){
      setBusy(button, false);
      setError('code-input', 'code-err', error.message);
    });
  });

  $('code-resend').addEventListener('click', function(){
    var status = $('code-status');
    status.textContent = 'Sending…';
    var again = codeMode === 'reset' ? Account.startReset($('code-email').textContent) : Account.resendSignUp();
    again.then(function(){
      status.textContent = 'Sent. It can take a minute to arrive.';
    }, function(error){
      status.textContent = error.message;
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
    openStart();
  });

  // ---------- what would you like more of ----------
  function finish(){
    go('options');
  }
  var choices = document.querySelectorAll('.choice');
  for (var c = 0; c < choices.length; c++){
    choices[c].addEventListener('click', function(){
      picked = this.getAttribute('data-more');
      finish();
    });
  }
  // The Friend's box takes several lines, so Enter makes a new line and the arrow sends.
  $('jot-form').addEventListener('submit', function(event){
    event.preventDefault();
    var text = $('jot').value.trim();
    if (!text){ finish(); return; }
    // What they wrote goes to Bestie, not the Options page.
    picked = text;
    $('jot').value = '';
    go('dash');
    if (window.OptionalDash && window.OptionalDash.sendFromBar){ window.OptionalDash.sendFromBar(text); }
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

    var button = this.querySelector('button[type="submit"]');
    setBusy(button, true, 'Logging in…');
    Account.logIn(email, pass).then(function(result){
      setBusy(button, false);
      $('li-pass').value = '';
      if (result.needsCode){ openCode('signup', result.email); return; }
      if (result.recoveryKey){
        setFriend(''); setNickname('');
        showRecoveryKey(result.recoveryKey, 'Your account is ready.');
      } else {
        enterApp(result.settings);
      }
    }, function(error){
      setBusy(button, false);
      setError(null, 'li-err', error.message);
    });
  });

  // ---------- forgot password: step 1, send a code ----------
  $('forgot-form').addEventListener('submit', function(event){
    event.preventDefault();
    var email = $('fg-email').value.trim();
    if (!looksLikeEmail(email)){
      setError('fg-email', 'fg-err', 'Enter your email address, like name@example.com.');
      $('fg-email').focus();
      return;
    }
    setError('fg-email', 'fg-err', '');
    var button = this.querySelector('button[type="submit"]');
    setBusy(button, true, 'Sending…');
    Account.startReset(email).then(function(){
      setBusy(button, false);
      openCode('reset', email);
    }, function(error){
      setBusy(button, false);
      setError('fg-email', 'fg-err', error.message);
    });
  });

  // ---------- forgot password: step 3, recovery key and new password ----------
  $('reset-form').addEventListener('submit', function(event){
    event.preventDefault();
    var key = $('rs-key').value.trim();
    var pass = $('rs-pass').value;
    var keyError = key.replace(/[^A-Za-z0-9]/g, '').length < 20 ? 'Enter your full recovery key. It has 24 letters and numbers.' : '';
    var passError = passwordProblem(pass);
    setError('rs-key', 'rs-key-err', keyError);
    setError('rs-pass', 'rs-pass-err', passError);
    setError(null, 'rs-form-err', '');
    if (keyError){ $('rs-key').focus(); return; }
    if (passError){ $('rs-pass').focus(); return; }

    var button = this.querySelector('button[type="submit"]');
    setBusy(button, true, 'Checking your password…');
    Account.isLeakedPassword(pass).then(function(leaked){
      if (leaked){
        setBusy(button, false);
        setError('rs-pass', 'rs-pass-err', LEAKED);
        $('rs-pass').focus();
        return;
      }
      button.textContent = 'Unlocking your entries…';
      return Account.finishReset(key, pass).then(function(result){
        setBusy(button, false);
        $('rs-key').value = ''; $('rs-pass').value = '';
        enterApp(result.settings);
      });
    }).catch(function(error){
      setBusy(button, false);
      if (error.original && error.original.message === 'wrong-key'){
        setError('rs-key', 'rs-key-err', error.message);
        $('rs-key').focus();
      } else {
        setError(null, 'rs-form-err', error.message);
      }
    });
  });

  // ---------- forgot password: no recovery key, start fresh ----------
  $('fresh-form').addEventListener('submit', function(event){
    event.preventDefault();
    var pass = $('fr-pass').value;
    var passError = passwordProblem(pass);
    var sure = $('fr-sure').checked;
    setError('fr-pass', 'fr-pass-err', passError);
    setError(null, 'fr-sure-err', sure ? '' : 'Tick the box to confirm.');
    setError(null, 'fr-form-err', '');
    if (passError){ $('fr-pass').focus(); return; }
    if (!sure){ $('fr-sure').focus(); return; }

    var button = this.querySelector('button[type="submit"]');
    setBusy(button, true, 'Checking your password…');
    Account.isLeakedPassword(pass).then(function(leaked){
      if (leaked){
        setBusy(button, false);
        setError('fr-pass', 'fr-pass-err', LEAKED);
        $('fr-pass').focus();
        return;
      }
      button.textContent = 'Starting fresh…';
      return Account.startFresh(pass).then(function(result){
        setBusy(button, false);
        $('fr-pass').value = ''; $('fr-sure').checked = false;
        setFriend(''); setNickname('');
        showRecoveryKey(result.recoveryKey, "You're set up again. Here is your new key.");
      });
    }).catch(function(error){
      setBusy(button, false);
      setError(null, 'fr-form-err', error.message);
    });
  });

  // ---------- log out ----------
  function logOut(){
    if (window.OptionalInApp){ window.OptionalInApp.closeAll(); }
    if (window.OptionalDash){ window.OptionalDash.reset(); }
    extras = {};
    Account.logOut().then(function(){
      setFriend('');
      setNickname('');
      codeMode = '';
      var clear = ['cheer-name','user-name','su-email','li-email','fg-email','rs-key','jot'];
      for (var i = 0; i < clear.length; i++){ $(clear[i]).value = ''; }
      go('welcome');
    });
  }
  var outs = document.querySelectorAll('.do-logout');
  for (var o = 0; o < outs.length; o++){ outs[o].addEventListener('click', logOut); }

  // ---------- what the in-app pages need from here ----------
  window.OptionalApp = {
    go: go,
    saveAvatar: function(key){
      avatar = key;
      return Account.saveSettings(allSettings());
    },
    updateSettings: function(patch){
      for (var k in patch){ if (k === 'friendLook' || k === 'hidden' || k === 'reminders' || k === 'lock') extras[k] = patch[k]; }
      return Account.saveSettings(allSettings());
    }
  };

  // ---------- start ----------
  window.addEventListener('hashchange', function(){
    show(location.hash.replace('#','') || 'welcome', true);
  });
  show(location.hash.replace('#','') || 'welcome', false);
})();
