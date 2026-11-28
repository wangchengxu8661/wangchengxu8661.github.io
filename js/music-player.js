'use strict';

/* ============================================================================
   侧边歌单播放器
   加歌/换歌：修改下面的 TRACKS，音频与封面放在 site/source/music/。
   播放器由脚本自行插入页面，不依赖主题模板，主题升级不会覆盖。
   ========================================================================= */
const TRACKS = [
  {
    src: '/music/unique.mp3',
    cover: '/music/unique-cover.webp',
    title: '唯一',
    artist: 'G.E.M. 邓紫棋',
    album: 'T.I.M.E.',
    duration: 253.735
  },
  {
    src: '/music/fan-fang-xiang-de-zhong.mp3',
    cover: '/music/fan-fang-xiang-de-zhong.webp',
    title: '反方向的钟',
    artist: '周杰伦',
    album: '叶惠美',
    duration: 258.108
  },
  {
    src: '/music/chun-jiao-yu-zhi-ming.mp3',
    cover: '/music/chun-jiao-yu-zhi-ming.webp',
    title: '春娇与志明',
    artist: '街道办GDC / 欧阳耀莹',
    album: '春娇与志明',
    duration: 205
  },
  {
    src: '/music/pao-mo.mp3',
    cover: '/music/pao-mo.webp',
    title: '泡沫',
    artist: 'G.E.M. 邓紫棋',
    album: 'Xposed',
    duration: 258.867
  },
  {
    src: '/music/yuan-fen-yi-dao-qiao.mp3',
    cover: '/music/yuan-fen-yi-dao-qiao.webp',
    title: '缘分一道桥',
    artist: '王力宏 / 谭维维',
    album: '长城',
    duration: 246.167
  }
];

(function initMusicPlayer() {
  if (document.getElementById('mp-root')) return;

  const first = TRACKS[0];
  const root = document.createElement('div');
  root.id = 'mp-root';
  root.className = 'mp';
  root.dataset.open = 'false';
  root.dataset.playing = 'false';
  root.innerHTML = `
    <div class="mp__dock">
      <button class="mp__trigger" type="button" aria-expanded="false" aria-controls="mp-panel"
        aria-label="打开音乐播放器：《${first.title}》" title="播放音乐">
        <span class="mp__disc"><img src="${first.cover}" alt="" width="640" height="640" decoding="async"></span>
        <span class="mp__badge" aria-hidden="true">
          <i class="fas fa-music"></i>
          <span class="mp__bars"><i></i><i></i><i></i></span>
        </span>
        <span class="mp__pulse" aria-hidden="true"></span>
      </button>

      <section class="mp__panel" id="mp-panel" aria-label="音乐播放器" aria-hidden="true" inert>
        <div class="mp__top">
          <span class="mp__tag">
            <i class="fas fa-list-ul" aria-hidden="true"></i> 播放列表
            <b class="mp__count">1 / ${TRACKS.length}</b>
          </span>
          <button class="mp__close" type="button" aria-label="收起播放器" title="收起播放器">
            <i class="fas fa-chevron-left" aria-hidden="true"></i>
          </button>
        </div>

        <div class="mp__art">
          <img src="${first.cover}" alt="《${first.title}》封面" width="640" height="640" decoding="async">
        </div>

        <div class="mp__meta">
          <p class="mp__title" title="${first.title}">${first.title}</p>
          <p class="mp__sub"><span>${first.artist}</span><span class="mp__dot" aria-hidden="true">·</span><span>${first.album}</span></p>
        </div>

        <div class="mp__seek" role="slider" tabindex="0" aria-label="播放进度"
          aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0:00">
          <span class="mp__rail"><span class="mp__fill"></span><span class="mp__knob"></span></span>
        </div>
        <div class="mp__time"><span class="mp__now">0:00</span><span class="mp__total">${formatTime(first.duration)}</span></div>

        <div class="mp__controls">
          <button class="mp__step mp__prev" type="button" aria-label="上一首" title="上一首">
            <i class="fas fa-backward-step" aria-hidden="true"></i>
          </button>
          <button class="mp__play" type="button" aria-label="播放" title="播放">
            <i class="fas fa-play" aria-hidden="true"></i>
          </button>
          <button class="mp__step mp__next" type="button" aria-label="下一首" title="下一首">
            <i class="fas fa-forward-step" aria-hidden="true"></i>
          </button>
          <div class="mp__vol">
            <button class="mp__mute" type="button" aria-label="静音" title="静音">
              <i class="fas fa-volume-high" aria-hidden="true"></i>
            </button>
            <input class="mp__volume" type="range" min="0" max="1" step="0.01" value="0.7" aria-label="音量">
          </div>
        </div>

        <ul class="mp__list" aria-label="播放列表"></ul>
        <p class="mp__error" role="status" hidden></p>
      </section>

      <audio class="mp__audio" preload="none" hidden></audio>
    </div>`;
  document.body.appendChild(root);

  const $ = selector => root.querySelector(selector);
  const trigger = $('.mp__trigger');
  const triggerCover = $('.mp__disc img');
  const panel = $('.mp__panel');
  const artCover = $('.mp__art img');
  const metaTitle = $('.mp__title');
  const metaSub = $('.mp__sub');
  const countLabel = $('.mp__count');
  const list = $('.mp__list');
  const prevBtn = $('.mp__prev');
  const nextBtn = $('.mp__next');
  const audio = $('.mp__audio');
  const playBtn = $('.mp__play');
  const playIcon = playBtn.querySelector('i');
  const seek = $('.mp__seek');
  const nowLabel = $('.mp__now');
  const totalLabel = $('.mp__total');
  const muteBtn = $('.mp__mute');
  const muteIcon = muteBtn.querySelector('i');
  const volume = $('.mp__volume');
  const errorLine = $('.mp__error');

  let current = 0;
  let open = false;
  let dragging = false;
  let lastVolume = 0.7;

  /* ---------- 歌单列表 ---------- */
  list.innerHTML = TRACKS.map((track, index) => `
    <li>
      <button class="mp__item${index === current ? ' is-current' : ''}" type="button" data-index="${index}"
        aria-label="播放《${track.title}》"${index === current ? ' aria-current="true"' : ''}>
        <span class="mp__num">${String(index + 1).padStart(2, '0')}</span>
        <span class="mp__item-title">${track.title}</span>
        <span class="mp__item-time">${formatTime(track.duration)}</span>
      </button>
    </li>`).join('');
  const items = [...list.querySelectorAll('.mp__item')];

  function track() {
    return TRACKS[current];
  }

  /* ---------- 本地记忆：音量 ---------- */
  const store = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch { /* 隐私模式忽略 */ }
    }
  };

  const savedVolume = Number(store.get('xur0n-music-volume', '0.7'));
  const startVolume = Number.isFinite(savedVolume) ? Math.min(1, Math.max(0, savedVolume)) : 0.7;
  audio.volume = startVolume;
  if (startVolume > 0) lastVolume = startVolume;
  volume.value = String(startVolume);
  paintVolume();

  /* ---------- 时间与进度 ---------- */
  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
    const total = Math.floor(seconds);
    return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
  }

  function duration() {
    return Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : track().duration;
  }

  function paintProgress() {
    const total = duration();
    const now = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    const percent = total > 0 ? Math.min(100, Math.max(0, (now / total) * 100)) : 0;
    seek.style.setProperty('--mp-progress', percent + '%');
    nowLabel.textContent = formatTime(now);
    totalLabel.textContent = formatTime(total);
    seek.setAttribute('aria-valuenow', String(Math.round(percent)));
    seek.setAttribute('aria-valuetext', formatTime(now) + ' / ' + formatTime(total));
  }

  function seekToClientX(clientX) {
    if (!audio.getAttribute('src')) audio.src = track().src;
    const rail = seek.querySelector('.mp__rail');
    const rect = rail.getBoundingClientRect();
    const ratio = rect.width > 0 ? Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) : 0;
    audio.currentTime = ratio * duration();
    paintProgress();
  }

  seek.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true;
    seek.setPointerCapture(event.pointerId);
    seekToClientX(event.clientX);
    event.preventDefault();
  });
  seek.addEventListener('pointermove', event => {
    if (dragging) seekToClientX(event.clientX);
  });
  const endDrag = event => {
    if (!dragging) return;
    dragging = false;
    if (event.type === 'pointerup') seekToClientX(event.clientX);
    try { seek.releasePointerCapture(event.pointerId); } catch { /* 已释放 */ }
  };
  seek.addEventListener('pointerup', endDrag);
  seek.addEventListener('pointercancel', endDrag);
  seek.addEventListener('keydown', event => {
    const total = duration();
    const step = event.shiftKey ? 15 : 5;
    let target = audio.currentTime;
    if (event.key === 'ArrowRight') target += step;
    else if (event.key === 'ArrowLeft') target -= step;
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = total - 0.25;
    else return;
    event.preventDefault();
    audio.currentTime = Math.min(total, Math.max(0, target));
    paintProgress();
  });

  /* ---------- 播放 / 暂停 ---------- */
  function showError(message) {
    errorLine.textContent = message;
    errorLine.hidden = false;
  }

  function clearError() {
    errorLine.hidden = true;
    errorLine.textContent = '';
  }

  function paintPlayState() {
    const playing = !audio.paused && !audio.ended;
    root.dataset.playing = String(playing);
    playBtn.dataset.state = playing ? 'playing' : 'paused';
    playIcon.className = playing ? 'fas fa-pause' : 'fas fa-play';
    playBtn.setAttribute('aria-label', playing ? '暂停' : '播放');
    playBtn.title = playing ? '暂停' : '播放';
    trigger.setAttribute('aria-label', (open ? '收起播放器' : '打开音乐播放器') + '：《' + track().title + '》');
    trigger.title = open ? '收起播放器' : '播放音乐';
    if ('mediaSession' in navigator) {
      try { navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'; } catch { /* 忽略 */ }
    }
    paintProgress();
  }

  async function togglePlay() {
    if (!audio.paused) {
      audio.pause();
      return;
    }
    clearError();
    if (!audio.getAttribute('src')) {
      audio.src = track().src;
    }
    root.dataset.loading = 'true';
    try {
      await audio.play();
    } catch (error) {
      if (error.name !== 'AbortError') showError('浏览器暂时阻止了播放，请再点一次。');
    } finally {
      root.dataset.loading = 'false';
    }
  }

  /* ---------- 切歌 ---------- */
  function updateList() {
    items.forEach((item, index) => {
      const active = index === current;
      item.classList.toggle('is-current', active);
      if (active) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
    });
  }

  function paintTrack() {
    const value = track();
    triggerCover.src = value.cover;
    artCover.src = value.cover;
    artCover.alt = '《' + value.title + '》封面';
    metaTitle.textContent = value.title;
    metaTitle.title = value.title;
    const artist = document.createElement('span');
    artist.textContent = value.artist;
    const dot = document.createElement('span');
    dot.className = 'mp__dot';
    dot.setAttribute('aria-hidden', 'true');
    dot.textContent = '·';
    const album = document.createElement('span');
    album.textContent = value.album;
    metaSub.replaceChildren(artist, dot, album);
    countLabel.textContent = (current + 1) + ' / ' + TRACKS.length;
    totalLabel.textContent = formatTime(value.duration);
    updateList();
    trigger.setAttribute('aria-label', (open ? '收起播放器' : '打开音乐播放器') + '：《' + value.title + '》');
    trigger.title = open ? '收起播放器' : '播放音乐';
    paintProgress();
  }

  function loadTrack(index, autoplay) {
    current = (index + TRACKS.length) % TRACKS.length;
    clearError();
    if (autoplay) {
      audio.src = track().src;
      audio.load();
    } else {
      audio.pause();
      audio.removeAttribute('src');
    }
    paintTrack();
    paintPlayState();
    setupMediaSession();
    if (autoplay) {
      root.dataset.loading = 'true';
      audio.play().catch(error => {
        if (error.name !== 'AbortError') showError('浏览器暂时阻止了播放，请再点一次。');
      }).finally(() => {
        root.dataset.loading = 'false';
      });
    }
  }

  function step(delta) {
    loadTrack(current + delta, !audio.paused);
  }

  playBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));
  items.forEach((item, index) => item.addEventListener('click', () => {
    if (index === current) {
      togglePlay();
      return;
    }
    loadTrack(index, true);
  }));

  audio.addEventListener('play', paintPlayState);
  audio.addEventListener('pause', paintPlayState);
  audio.addEventListener('ended', () => {
    if (TRACKS.length > 1) loadTrack(current + 1, true);
    else {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  });
  audio.addEventListener('timeupdate', () => { if (!dragging) paintProgress(); });
  audio.addEventListener('durationchange', paintProgress);
  audio.addEventListener('loadedmetadata', () => {
    paintProgress();
    setupMediaSession();
  });
  audio.addEventListener('error', () => {
    showError('音频加载失败，请检查 /music/ 中的文件是否存在。');
    root.dataset.loading = 'false';
  });

  /* ---------- 音量 ---------- */
  function paintVolume() {
    const value = audio.muted ? 0 : audio.volume;
    volume.style.setProperty('--mp-volume', value * 100 + '%');
    const icon = value === 0 ? 'fa-volume-xmark' : value < 0.45 ? 'fa-volume-low' : 'fa-volume-high';
    muteIcon.className = 'fas ' + icon;
    muteBtn.setAttribute('aria-label', value === 0 ? '取消静音' : '静音');
    muteBtn.title = value === 0 ? '取消静音' : '静音';
  }

  volume.addEventListener('input', () => {
    const value = Number(volume.value);
    audio.muted = false;
    audio.volume = value;
    if (value > 0) lastVolume = value;
    store.set('xur0n-music-volume', String(value));
    paintVolume();
  });

  muteBtn.addEventListener('click', () => {
    if (audio.muted || audio.volume === 0) {
      audio.muted = false;
      audio.volume = lastVolume || 0.7;
      volume.value = String(audio.volume);
      store.set('xur0n-music-volume', String(audio.volume));
    } else {
      lastVolume = audio.volume;
      audio.muted = true;
      volume.value = '0';
    }
    paintVolume();
  });

  /* ---------- 展开 / 收起 ---------- */
  function setOpen(next) {
    open = next;
    root.dataset.open = String(open);
    trigger.setAttribute('aria-expanded', String(open));
    trigger.setAttribute('aria-label', (open ? '收起播放器' : '打开音乐播放器') + '：《' + track().title + '》');
    trigger.title = open ? '收起播放器' : '播放音乐';
    panel.setAttribute('aria-hidden', String(!open));
    panel.inert = !open;
  }

  trigger.addEventListener('click', () => setOpen(!open));
  $('.mp__close').addEventListener('click', () => {
    setOpen(false);
    trigger.focus();
  });

  document.addEventListener('pointerdown', event => {
    if (open && !root.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && open) {
      setOpen(false);
      trigger.focus();
    }
  });

  /* ---------- 系统媒体控制（锁屏、耳机按键） ---------- */
  function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    try {
      const value = track();
      navigator.mediaSession.metadata = new MediaMetadata({
        title: value.title,
        artist: value.artist,
        album: value.album,
        artwork: [{ src: value.cover, sizes: '640x640', type: 'image/webp' }]
      });
      const handlers = {
        play: () => { audio.play().catch(() => {}); },
        pause: () => audio.pause(),
        stop: () => { audio.pause(); audio.currentTime = 0; paintProgress(); },
        nexttrack: () => step(1),
        previoustrack: () => step(-1),
        seekbackward: details => { audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10)); },
        seekforward: details => { audio.currentTime = Math.min(duration(), audio.currentTime + (details.seekOffset || 10)); },
        seekto: details => { if (Number.isFinite(details.seekTime)) audio.currentTime = details.seekTime; }
      };
      for (const [action, handler] of Object.entries(handlers)) {
        try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* 浏览器不支持该动作 */ }
      }
    } catch { /* Media Session 不可用 */ }
  }

  /* ---------- 初始状态：默认收起，只记住音量 ---------- */
  setOpen(false);
  loadTrack(0, false);
  paintPlayState();
})();
