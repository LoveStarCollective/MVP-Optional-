// Goes into the app (account.js area) when we lock the Bestie page.
// Sends the visible chat to the server piece. Falls back to "almost here" until the key is in.
async function askBestie(client, thread, friend, nick){
  try {
    const { data, error } = await client.functions.invoke('bestie', { body: { messages: thread, friend, nick } });
    if (error) {
      const code = error.context && error.context.status;
      if (code === 503) return { text: friend + '’s traversing the interwebs, making their way to you. Be here when they land.' };
      if (code === 429) return { text: 'I’m glad you’re expressing yourself. Let’s keep it going tomorrow. If you need more help now, tap Help if Needed in the menu.' };
      return { text: 'Uh-oh... I’m at a loss for words. Give me a moment and try again.' };
    }
    return data;
  } catch (e) {
    return { text: 'Uh-oh... I’m at a loss for words. Give me a moment and try again.' };
  }
}

// Shows a small heads-up under "I got you. Type away." only when 10 or fewer messages are left today.
function showLeft(left){
  var el = document.getElementById('talk-left'); if (!el) return;
  el.textContent = (typeof left === 'number' && left <= 10) ? left + (left === 1 ? ' message' : ' messages') + ' left today.' : '';
}
