// =========================================================
// OPTIONAL — accounts and encryption
//
// How privacy works here:
// 1. Each account gets one random "data key" made on the phone.
// 2. Everything private is scrambled with that data key before it
//    is sent to Supabase, so the database only ever holds gibberish.
// 3. The data key itself is stored twice, scrambled two ways:
//    once with a key made from the password, and once with a key
//    made from the recovery key. Either one can unlock it.
// 4. The password-made key and recovery key never leave the phone.
// =========================================================
(function(){
  // These two values are safe to publish. The SECRET key never goes here.
  var SUPABASE_URL = 'https://qpwdqtbeynzlaamkauum.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_LXXN_KBpW-l_e-_935nDEg_TzUgfrAy';

  var ITERATIONS = 600000;   // how hard a password is stretched (PBKDF2)
  var client = null;         // the Supabase connection
  var dataKey = null;        // lives in memory only while logged in
  var userId = null;
  var pending = null;        // a sign-up waiting for its email code: { email, password, settings }
  var resetEmail = null;     // a password reset in progress
  var resetRow = null;       // that account's saved row, once the email code is accepted
  var resetReady = false;

  var encoder = new TextEncoder();
  var decoder = new TextDecoder();

  // ---------- small helpers ----------
  function getClient(){
    if (!client){
      if (!window.supabase){ throw new Error('offline'); }
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        // Nothing about the login is kept on the phone after the page closes.
        auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false }
      });
    }
    return client;
  }

  function toBase64(bytes){
    var view = new Uint8Array(bytes);
    var text = '';
    for (var i = 0; i < view.length; i++){ text += String.fromCharCode(view[i]); }
    return btoa(text);
  }

  function fromBase64(text){
    var raw = atob(text);
    var bytes = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++){ bytes[i] = raw.charCodeAt(i); }
    return bytes;
  }

  function randomBytes(count){
    var bytes = new Uint8Array(count);
    window.crypto.getRandomValues(bytes);
    return bytes;
  }

  // ---------- encryption ----------
  // Turn a password or recovery key into an encryption key.
  async function deriveKey(secret, salt, iterations){
    var base = await crypto.subtle.importKey('raw', encoder.encode(secret), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt, iterations: iterations, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Scramble bytes. The result is "iv.ciphertext", both in base64.
  async function encryptBytes(key, bytes){
    var iv = randomBytes(12);
    var scrambled = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, bytes);
    return toBase64(iv) + '.' + toBase64(scrambled);
  }

  async function decryptBytes(key, packed){
    var parts = packed.split('.');
    var plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(parts[0]) }, key, fromBase64(parts[1]));
    return new Uint8Array(plain);
  }

  async function encryptJSON(value){
    return encryptBytes(dataKey, encoder.encode(JSON.stringify(value)));
  }

  async function decryptJSON(packed){
    return JSON.parse(decoder.decode(await decryptBytes(dataKey, packed)));
  }

  // ---------- recovery key ----------
  // 24 characters from 32 easy-to-read letters and numbers.
  function makeRecoveryKey(){
    var letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var values = randomBytes(24);
    var out = '';
    for (var i = 0; i < values.length; i++){
      if (i > 0 && i % 4 === 0){ out += ' '; }
      out += letters[values[i] % letters.length];
    }
    return out;
  }

  function cleanRecoveryKey(text){
    return text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }

  // ---------- friendly error messages ----------
  function friendly(error){
    var code = (error && error.code) || '';
    var message = ((error && error.message) || '').toLowerCase();
    if (message === 'offline' || message.indexOf('failed to fetch') !== -1 || message.indexOf('network') !== -1){
      return "Couldn't reach the server. Check your connection and try again.";
    }
    if (code === 'user_already_exists' || message.indexOf('already registered') !== -1){
      return 'That email already has an account. Try logging in.';
    }
    if (code === 'invalid_credentials' || message.indexOf('invalid login') !== -1){
      return "That email and password don't match.";
    }
    if (code === 'email_not_confirmed' || message.indexOf('not confirmed') !== -1){
      return 'Check your email for a confirmation link, then log in.';
    }
    if (message === 'wrong-key'){
      return "That recovery key doesn't match. Check each character and try again.";
    }
    if (message === 'needs-reset'){
      return 'Your password was changed but your entries were not unlocked. Tap "Forgot password?" and use your recovery key.';
    }
    if (message === 'no-pending'){
      return 'That step timed out. Please start again.';
    }
    if (code === 'otp_expired' || message.indexOf('expired') !== -1 || message.indexOf('invalid') !== -1 && message.indexOf('token') !== -1){
      return "That code didn't work. Check it, or ask for a new one.";
    }
    if (code === 'same_password'){
      return "Choose a password you haven't used here before.";
    }
    if (code === 'weak_password'){
      return 'Please choose a stronger password.';
    }
    if (code.indexOf('rate_limit') !== -1 || message.indexOf('rate limit') !== -1){
      return 'Too many tries. Wait a minute and try again.';
    }
    return 'Something went wrong. Please try again.';
  }

  function fail(error){
    if (window.console){ console.error('Optional account error:', error); }
    var wrapped = new Error(friendly(error));
    wrapped.original = error;
    return wrapped;
  }

  // ---------- account setup ----------
  // Makes the data key, wraps it with the password and the recovery key,
  // and saves the wrapped copies. Returns the recovery key to show once.
  async function createProfile(password, settings){
    var rawKey = randomBytes(32);
    dataKey = await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);

    var passwordSalt = randomBytes(16);
    var recoverySalt = randomBytes(16);
    var recoveryKey = makeRecoveryKey();

    var passwordKey = await deriveKey(password, passwordSalt, ITERATIONS);
    var recoveryDerived = await deriveKey(cleanRecoveryKey(recoveryKey), recoverySalt, ITERATIONS);

    var row = {
      user_id: userId,
      kdf_iterations: ITERATIONS,
      password_salt: toBase64(passwordSalt),
      key_by_password: await encryptBytes(passwordKey, rawKey),
      recovery_salt: toBase64(recoverySalt),
      key_by_recovery: await encryptBytes(recoveryDerived, rawKey),
      settings: await encryptJSON(settings || {})
    };
    rawKey.fill(0);

    var result = await getClient().from('profiles').insert(row);
    if (result.error){ throw result.error; }
    return recoveryKey;
  }

  // ---------- what the pages call ----------
  var Account = {

    // Create an account. settings = { friend: "...", nick: "..." }
    // Resolves to { recoveryKey } or { needsConfirm: true }.
    signUp: async function(email, password, settings){
      try {
        var result = await getClient().auth.signUp({ email: email, password: password });
        if (result.error){ throw result.error; }
        if (!result.data || !result.data.session){
          pending = { email: email, password: password, settings: settings || {} };
          return { needsCode: true, email: email };
        }
        userId = result.data.user.id;
        var recoveryKey = await createProfile(password, settings);
        return { recoveryKey: recoveryKey };
      } catch (error){
        throw fail(error);
      }
    },

    // Log in and unlock the data key.
    // Resolves to { settings } and, for a first log in, { recoveryKey } too.
    logIn: async function(email, password){
      try {
        var result = await getClient().auth.signInWithPassword({ email: email, password: password });
        if (result.error && result.error.code === 'email_not_confirmed'){
          pending = { email: email, password: password, settings: {} };
          await getClient().auth.resend({ type: 'signup', email: email });
          return { needsCode: true, email: email };
        }
        if (result.error){ throw result.error; }
        userId = result.data.user.id;

        var found = await getClient().from('profiles').select('*').eq('user_id', userId).maybeSingle();
        if (found.error){ throw found.error; }

        // Account exists but was never set up (for example, email was confirmed later).
        if (!found.data){
          var recoveryKey = await createProfile(password, {});
          return { settings: {}, recoveryKey: recoveryKey };
        }

        var row = found.data;
        var passwordKey = await deriveKey(password, fromBase64(row.password_salt), row.kdf_iterations);
        var rawKey;
        try { rawKey = await decryptBytes(passwordKey, row.key_by_password); }
        catch (locked){ throw new Error('needs-reset'); }
        dataKey = await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
        rawKey.fill(0);

        var settings = row.settings ? await decryptJSON(row.settings) : {};
        return { settings: settings };
      } catch (error){
        dataKey = null;
        throw fail(error);
      }
    },

    // Save the Friend's name and the user's nickname, encrypted.
    saveSettings: async function(settings){
      try {
        if (!dataKey){ throw new Error('locked'); }
        var result = await getClient().from('profiles')
          .update({ settings: await encryptJSON(settings), updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        if (result.error){ throw result.error; }
      } catch (error){
        throw fail(error);
      }
    },

    // Finish a sign-up by typing the code from the confirmation email.
    confirmSignUp: async function(code){
      try {
        if (!pending){ throw new Error('no-pending'); }
        var result = await getClient().auth.verifyOtp({ email: pending.email, token: code, type: 'email' });
        if (result.error){ throw result.error; }
        userId = result.data.user.id;

        // If this account was already set up, just unlock it.
        var found = await getClient().from('profiles').select('*').eq('user_id', userId).maybeSingle();
        if (found.error){ throw found.error; }
        if (found.data){
          var key = await deriveKey(pending.password, fromBase64(found.data.password_salt), found.data.kdf_iterations);
          var raw;
          try { raw = await decryptBytes(key, found.data.key_by_password); }
          catch (locked){ throw new Error('needs-reset'); }
          dataKey = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
          raw.fill(0);
          var saved = found.data.settings ? await decryptJSON(found.data.settings) : {};
          pending = null;
          return { settings: saved };
        }

        var settings = pending.settings;
        var recoveryKey = await createProfile(pending.password, settings);
        pending = null;
        return { recoveryKey: recoveryKey, settings: settings };
      } catch (error){
        throw fail(error);
      }
    },

    // Send the sign-up code again.
    resendSignUp: async function(){
      try {
        if (!pending){ throw new Error('no-pending'); }
        var result = await getClient().auth.resend({ type: 'signup', email: pending.email });
        if (result.error){ throw result.error; }
      } catch (error){
        throw fail(error);
      }
    },

    // ----- forgot password -----
    // Step 1: email a code. (Supabase answers the same way whether or not the
    // email has an account, so nobody can use this to check who is signed up.)
    startReset: async function(email){
      try {
        resetEmail = email; resetRow = null; resetReady = false;
        var result = await getClient().auth.resetPasswordForEmail(email);
        if (result.error){ throw result.error; }
      } catch (error){
        throw fail(error);
      }
    },

    // Step 2: the code from the email proves they own the address.
    verifyResetCode: async function(code){
      try {
        if (!resetEmail){ throw new Error('no-pending'); }
        var result = await getClient().auth.verifyOtp({ email: resetEmail, token: code, type: 'recovery' });
        if (result.error){ throw result.error; }
        userId = result.data.user.id;
        var found = await getClient().from('profiles').select('*').eq('user_id', userId).maybeSingle();
        if (found.error){ throw found.error; }
        resetRow = found.data || null;
        resetReady = true;
        return { hasEntries: !!resetRow };
      } catch (error){
        throw fail(error);
      }
    },

    // Step 3: the recovery key unlocks the data key, which is then
    // locked again with the new password. Nothing is lost.
    finishReset: async function(recoveryKey, newPassword){
      try {
        if (!resetReady || !resetRow){ throw new Error('no-pending'); }
        var recoveryDerived = await deriveKey(cleanRecoveryKey(recoveryKey), fromBase64(resetRow.recovery_salt), resetRow.kdf_iterations);
        var rawKey;
        try { rawKey = await decryptBytes(recoveryDerived, resetRow.key_by_recovery); }
        catch (wrong){ throw new Error('wrong-key'); }

        var changed = await getClient().auth.updateUser({ password: newPassword });
        if (changed.error){ rawKey.fill(0); throw changed.error; }

        var passwordSalt = randomBytes(16);
        var passwordKey = await deriveKey(newPassword, passwordSalt, ITERATIONS);
        var wrapped = await encryptBytes(passwordKey, rawKey);
        // The recovery copy is re-made too, so both copies use the same settings.
        var recoverySalt = randomBytes(16);
        var recoveryAgain = await deriveKey(cleanRecoveryKey(recoveryKey), recoverySalt, ITERATIONS);
        var saved = await getClient().from('profiles').update({
          kdf_iterations: ITERATIONS,
          password_salt: toBase64(passwordSalt),
          key_by_password: wrapped,
          recovery_salt: toBase64(recoverySalt),
          key_by_recovery: await encryptBytes(recoveryAgain, rawKey),
          updated_at: new Date().toISOString()
        }).eq('user_id', userId);
        if (saved.error){ rawKey.fill(0); throw saved.error; }

        dataKey = await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
        rawKey.fill(0);
        var settings = resetRow.settings ? await decryptJSON(resetRow.settings) : {};
        resetEmail = null; resetRow = null; resetReady = false;
        return { settings: settings };
      } catch (error){
        throw fail(error);
      }
    },

    // Lost the recovery key too: keep the account, erase what can never be
    // unlocked, and set up a brand new key.
    startFresh: async function(newPassword){
      try {
        if (!resetReady){ throw new Error('no-pending'); }
        var changed = await getClient().auth.updateUser({ password: newPassword });
        if (changed.error){ throw changed.error; }
        var wipedEntries = await getClient().from('entries').delete().eq('user_id', userId);
        if (wipedEntries.error){ throw wipedEntries.error; }
        var wipedProfile = await getClient().from('profiles').delete().eq('user_id', userId);
        if (wipedProfile.error){ throw wipedProfile.error; }
        var recoveryKey = await createProfile(newPassword, {});
        resetEmail = null; resetRow = null; resetReady = false;
        return { recoveryKey: recoveryKey };
      } catch (error){
        throw fail(error);
      }
    },

    hasPendingCode: function(){ return !!pending; },
    resetStage: function(){ return resetReady ? (resetRow ? 'ready' : 'empty') : (resetEmail ? 'code' : 'none'); },

    // Has this password shown up in a known data breach?
    // Only the first 5 characters of a scrambled (SHA-1) version are sent,
    // never the password itself. If the lookup fails, we let the password through.
    isLeakedPassword: async function(password){
      try {
        var digest = await crypto.subtle.digest('SHA-1', encoder.encode(password));
        var bytes = new Uint8Array(digest);
        var hex = '';
        for (var i = 0; i < bytes.length; i++){
          hex += ('0' + bytes[i].toString(16)).slice(-2);
        }
        hex = hex.toUpperCase();
        var response = await fetch('https://api.pwnedpasswords.com/range/' + hex.slice(0, 5));
        if (!response.ok){ return false; }
        var lines = (await response.text()).split('\n');
        var rest = hex.slice(5);
        for (var n = 0; n < lines.length; n++){
          var parts = lines[n].trim().split(':');
          if (parts[0] === rest && parseInt(parts[1], 10) > 0){ return true; }
        }
        return false;
      } catch (error){
        return false;
      }
    },

    logOut: async function(){
      dataKey = null;
      userId = null;
      pending = null; resetEmail = null; resetRow = null; resetReady = false;
      try { await getClient().auth.signOut(); } catch (error){ /* already logged out */ }
    },

    // ---------- Reminders: this phone's delivery address and the reminder times ----------
    enablePush: async function(){
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)){ throw new Error('no-push'); }
        var reg = await navigator.serviceWorker.register('sw.js');
        await navigator.serviceWorker.ready;
        var keyRes = await getClient().functions.invoke('reminders', { body: { action: 'key' } });
        if (keyRes.error || !keyRes.data || !keyRes.data.key){ throw keyRes.error || new Error('no-key'); }
        var raw = atob(keyRes.data.key.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((keyRes.data.key.length + 3) % 4));
        var appKey = new Uint8Array(raw.length); for (var i = 0; i < raw.length; i++){ appKey[i] = raw.charCodeAt(i); }
        var sub = await reg.pushManager.getSubscription();
        if (!sub){ sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey }); }
        var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        var saved = await getClient().functions.invoke('reminders', { body: { action: 'subscribe', subscription: sub.toJSON(), tz: tz } });
        if (saved.error){ throw saved.error; }
      } catch (error){
        throw fail(error);
      }
    },
    syncReminders: async function(times){
      try {
        var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        var res = await getClient().functions.invoke('reminders', { body: { action: 'set', times: times, tz: tz } });
        if (res.error){ throw res.error; }
      } catch (error){
        throw fail(error);
      }
    },

    // ---------- Journal entries and Cue Alarm check-ins (locked on the phone first) ----------
    addEntry: async function(kind, value){
      try {
        if (!dataKey){ throw new Error('locked'); }
        var result = await getClient().from('entries')
          .insert({ user_id: userId, kind: kind, data: await encryptJSON(value) })
          .select('id, created_at').single();
        if (result.error){ throw result.error; }
        return result.data;
      } catch (error){
        throw fail(error);
      }
    },
    listEntries: async function(kind){
      try {
        if (!dataKey){ throw new Error('locked'); }
        var result = await getClient().from('entries').select('id, data, created_at')
          .eq('user_id', userId).eq('kind', kind).order('created_at', { ascending: false }).limit(500);
        if (result.error){ throw result.error; }
        var out = [];
        for (var i = 0; i < (result.data || []).length; i++){
          var row = result.data[i];
          try { out.push({ id: row.id, at: row.created_at, value: await decryptJSON(row.data) }); } catch (e){ /* skip anything unreadable */ }
        }
        return out;
      } catch (error){
        throw fail(error);
      }
    },
    deleteEntry: async function(id){
      try {
        var result = await getClient().from('entries').delete().eq('id', id).eq('user_id', userId);
        if (result.error){ throw result.error; }
      } catch (error){
        throw fail(error);
      }
    },

    // Sends the recent chat to Bestie's server piece and returns { text, left } or { error }.
    askBestie: async function(messages, friend, nick){
      try {
        var res = await getClient().functions.invoke('bestie', { body: { messages: messages, friend: friend, nick: nick } });
        if (res.error){
          var code = res.error.context && res.error.context.status;
          return { error: code === 503 ? 'not_connected' : code === 429 ? 'limit' : code === 401 ? 'login' : 'other' };
        }
        return res.data || { error: 'other' };
      } catch (error){
        return { error: 'other' };
      }
    },

    // ---------- Good to Know community pins ----------
    // When the account was made, so the app can say when pinning opens up (the database checks it too).
    accountCreatedAt: async function(){
      var res = await getClient().auth.getUser();
      if (res.error || !res.data || !res.data.user){ throw fail(res.error || new Error('login')); }
      return res.data.user.created_at;
    },
    // Approved pins everyone can see (the database only returns approved ones, plus your own).
    listPins: async function(){
      var result = await getClient().from('pins').select('id, title, by, type, url, cats, why, nickname, status, created_at')
        .eq('status', 'approved').order('created_at', { ascending: false }).limit(300);
      if (result.error){ throw fail(result.error); }
      return result.data || [];
    },
    // A new pin waits as 'pending' until one of us approves it.
    addPin: async function(pin){
      var row = { user_id: userId, title: pin.title, by: pin.by || null, type: pin.type, url: pin.url || null, cats: pin.cats, why: pin.why, nickname: pin.nickname || null };
      var result = await getClient().from('pins').insert(row);
      if (result.error){ throw fail(result.error); }
    },
    reportPin: async function(id){
      var result = await getClient().from('pin_reports').insert({ pin_id: id, user_id: userId });
      if (result.error && result.error.code !== '23505'){ throw fail(result.error); }   // 23505 = already reported
    },

    isLoggedIn: function(){
      return !!dataKey;
    }
  };

  window.OptionalAccount = Account;
})();
