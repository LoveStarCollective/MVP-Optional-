// Original cartoon avatars for Optional (drawn from scratch, no existing characters).
(function(){
  function eyes(kind){
    if (kind === 'happy') return '<path d="M23.5 33q2.5-3 5 0M35.5 33q2.5-3 5 0" fill="none" stroke="#2A2420" stroke-width="1.8" stroke-linecap="round"/>';
    if (kind === 'wink') return '<ellipse cx="26.2" cy="32.4" rx="2.6" ry="3.4" fill="#2A2420"/><circle cx="27.1" cy="31.2" r="1" fill="#fff"/><path d="M35.5 33q2.5-3 5 0" fill="none" stroke="#2A2420" stroke-width="1.8" stroke-linecap="round"/>';
    return '<ellipse cx="26.2" cy="32.4" rx="2.6" ry="3.4" fill="#2A2420"/><ellipse cx="37.8" cy="32.4" rx="2.6" ry="3.4" fill="#2A2420"/>' +
           '<circle cx="27.1" cy="31.2" r="1" fill="#fff"/><circle cx="38.7" cy="31.2" r="1" fill="#fff"/><circle cx="25.6" cy="33.8" r="0.5" fill="#fff"/><circle cx="37.2" cy="33.8" r="0.5" fill="#fff"/>';
  }
  function face(skin, eyeKind, mouth){
    var m = mouth === 'open'
      ? '<path d="M29 38.5q3 3.6 6 0z" fill="#8C3B33"/>'
      : '<path d="M29.3 38.6q2.7 2.2 5.4 0" fill="none" stroke="#2A2420" stroke-width="1.5" stroke-linecap="round"/>';
    return '<ellipse cx="18.6" cy="33" rx="2" ry="2.8" fill="' + skin + '"/><ellipse cx="45.4" cy="33" rx="2" ry="2.8" fill="' + skin + '"/>' +
           '<ellipse cx="32" cy="31" rx="13.6" ry="14" fill="' + skin + '"/>' +
           '<ellipse cx="22.6" cy="36.6" rx="2.4" ry="1.3" fill="#E98A86" opacity="0.55"/><ellipse cx="41.4" cy="36.6" rx="2.4" ry="1.3" fill="#E98A86" opacity="0.55"/>' +
           eyes(eyeKind) + m;
  }
  function body(skin, shirt){
    return '<rect x="28.5" y="42" width="7" height="6" fill="' + skin + '"/>' +
           '<path d="M12 64c0-11 8.5-17 20-17s20 6 20 17z" fill="' + shirt + '"/>';
  }
  function svg(bg, inner){
    return '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="' + bg + '"/>' + inner + '</svg>';
  }
  window.OPTIONAL_AVATARS = {
    spiky: { name: 'Spiky hair', svg: svg('#7FA7C9',
      body('#F2C9A0', '#A4532A') +
      face('#F2C9A0', 'round', 'smile') +
      '<path d="M17.6 30c-1-9 5-15.5 14.4-15.5S47.5 21 46.4 30l-3-4-2 3.5-2.4-5.5-2.6 4.8-2.8-6-2.6 6-2.6-4.8-2.4 5.5-2-3.5z" fill="#3A2A22"/>' +
      '<path d="M25 13l3 4 1.5-6 3 5 2.5-6 2 6.5 3-4 .5 5" fill="#3A2A22"/>') },
    longhair: { name: 'Long hair with bangs', svg: svg('#E7B65C',
      '<path d="M16.5 30c0-11 7-17 15.5-17s15.5 6 15.5 17v22H16.5z" fill="#5B2E1F"/>' +
      body('#E4B48A', '#4F5C3A') +
      face('#E4B48A', 'round', 'open') +
      '<path d="M18 29c0-9 6-14.5 14-14.5S46 20 46 29c-4-1-6-4-7-7-2 4-7 6-12 6-3 0-6-.5-9 1z" fill="#5B2E1F"/>') },
    afro: { name: 'Afro puffs', svg: svg('#B86B78',
      '<circle cx="15" cy="20" r="8" fill="#241814"/><circle cx="49" cy="20" r="8" fill="#241814"/>' +
      body('#8A5634', '#E7B65C') +
      face('#8A5634', 'happy', 'open') +
      '<path d="M18.2 28c.6-8.5 6.6-13.6 13.8-13.6S45.2 19.5 45.8 28c-3.5-3.2-8-5-13.8-5s-10.3 1.8-13.8 5z" fill="#241814"/>') },
    locs: { name: 'Locs', svg: svg('#6E8455',
      '<path d="M17 28c0-9 6.5-14.5 15-14.5S47 19 47 28v4h-30z" fill="#2E1E16"/>' +
      '<g stroke="#2E1E16" stroke-width="3.6" stroke-linecap="round"><path d="M18 30v20M22 31v21M42 31v21M46 30v20"/></g>' +
      body('#6B4228', '#F7F2E9') +
      face('#6B4228', 'round', 'smile') +
      '<path d="M18.5 27.5c1.5-7 7-12 13.5-12s12 5 13.5 12c-2.5-1.5-4-4-5-6-2 3-5 4.5-8.5 4.5s-6.5-1.5-8.5-4.5c-1 2-2.5 4.5-5 6z" fill="#2E1E16"/>' +
      '<rect x="17" y="24" width="30" height="3" rx="1.5" fill="#A4532A"/>') },
    scarf: { name: 'Head scarf', svg: svg('#4F7FA0',
      '<path d="M14.5 34c0-13 7.5-21 17.5-21s17.5 8 17.5 21v12c-4 6-10.5 9-17.5 9s-13.5-3-17.5-9z" fill="#C46A3E"/>' +
      body('#C9926A', '#C46A3E') +
      '<ellipse cx="32" cy="32.5" rx="12" ry="12.6" fill="#C9926A"/>' +
      '<ellipse cx="23" cy="37.4" rx="2.3" ry="1.2" fill="#E98A86" opacity="0.55"/><ellipse cx="41" cy="37.4" rx="2.3" ry="1.2" fill="#E98A86" opacity="0.55"/>' +
      eyes('round') + '<path d="M29.3 39q2.7 2.2 5.4 0" fill="none" stroke="#2A2420" stroke-width="1.5" stroke-linecap="round"/>' +
      '<path d="M20 25c3-4.5 7-6.5 12-6.5s9 2 12 6.5" fill="none" stroke="#E7A07A" stroke-width="2.4" stroke-linecap="round"/>') },
    bun: { name: 'Top bun', svg: svg('#A4532A',
      '<circle cx="32" cy="12.5" r="6.5" fill="#1F1B1A"/>' +
      body('#F6D7B8', '#7FA7C9') +
      face('#F6D7B8', 'wink', 'smile') +
      '<path d="M18.2 29c0-8.5 6-14 13.8-14s13.8 5.5 13.8 14c-2-3-3.5-4.2-6-5.2-1 2.2-3 3.2-5 3.2 1-1.5 1.2-3 .8-4.4-2.5 2.5-6 3.6-9.6 3.4 1-1 1.6-2 1.8-3-3.4 1.3-6 3.4-9.6 6z" fill="#1F1B1A"/>') },
    beard: { name: 'Beard and glasses', svg: svg('#E7B65C',
      body('#D9A47C', '#2C3E4A') +
      face('#D9A47C', 'round', 'smile') +
      '<path d="M18.6 33c0 9 5.5 13.6 13.4 13.6S45.4 42 45.4 33c-1.5 3.5-4 5-6 4.6-2-.4-4.2-1.4-7.4-1.4s-5.4 1-7.4 1.4c-2 .4-4.5-1.1-6-4.6z" fill="#4A3426"/>' +
      '<path d="M28.6 39.2q3.4 2 6.8 0" fill="none" stroke="#2A2420" stroke-width="1.5" stroke-linecap="round"/>' +
      '<g fill="none" stroke="#2A2420" stroke-width="1.4"><circle cx="26.2" cy="32.4" r="4.4"/><circle cx="37.8" cy="32.4" r="4.4"/><path d="M30.6 32.2h2.8M21.8 31.6l-3-1M42.2 31.6l3-1"/></g>' +
      '<path d="M19.4 25c1.5-6 6.4-9.6 12.6-9.6S43.1 19 44.6 25c-3.8-2.4-8-3.4-12.6-3.4S23.2 22.6 19.4 25z" fill="#4A3426"/>') },
    curly: { name: 'Curly bob', svg: svg('#B86B78',
      '<g fill="#1F1412"><circle cx="18" cy="28" r="5.5"/><circle cx="17" cy="37" r="5"/><circle cx="20" cy="45" r="4.5"/><circle cx="46" cy="28" r="5.5"/><circle cx="47" cy="37" r="5"/><circle cx="44" cy="45" r="4.5"/></g>' +
      body('#7A4A2E', '#6E8455') +
      face('#7A4A2E', 'happy', 'smile') +
      '<g fill="#1F1412"><circle cx="22" cy="21" r="5.5"/><circle cx="29" cy="17.5" r="5.5"/><circle cx="36" cy="17.5" r="5.5"/><circle cx="42.5" cy="21" r="5.5"/><circle cx="19" cy="26" r="4.5"/><circle cx="45" cy="26" r="4.5"/></g>') },
    cat: { name: 'Cat friend', svg: svg('#6E8455',
      '<path d="M18 26l-2-13 10 7zM46 26l2-13-10 7z" fill="#E7A35C"/><path d="M19.5 22l-1-6 5 3.5zM44.5 22l1-6-5 3.5z" fill="#F4C9C4"/>' +
      '<path d="M14 64c0-10 8-16 18-16s18 6 18 16z" fill="#E7A35C"/>' +
      '<ellipse cx="32" cy="32" rx="15" ry="13.5" fill="#E7A35C"/>' +
      '<path d="M32 19v5M28 20l1.5 4M36 20l-1.5 4" stroke="#C47A35" stroke-width="1.6" stroke-linecap="round"/>' +
      eyes('round') +
      '<path d="M30.6 36.6h2.8l-1.4 1.6z" fill="#B85A5A"/><path d="M32 38.2q-1.6 2-3.4 1.2M32 38.2q1.6 2 3.4 1.2" fill="none" stroke="#2A2420" stroke-width="1.2" stroke-linecap="round"/>' +
      '<g stroke="#2A2420" stroke-width="0.9" stroke-linecap="round"><path d="M19 35h6M19 38l6-1M45 35h-6M45 38l-6-1"/></g>' +
      '<ellipse cx="22.6" cy="37" rx="2.3" ry="1.2" fill="#E98A86" opacity="0.5"/><ellipse cx="41.4" cy="37" rx="2.3" ry="1.2" fill="#E98A86" opacity="0.5"/>') }
  };
})();
