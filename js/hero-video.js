'use strict';

/* 首页和分类页的头图循环视频。PJAX 切换页面后重建；离开这些页面时清理旧视频和监听。 */
let stopHeroVideo = null;

function startHeroVideo() {
  if (stopHeroVideo) {
    stopHeroVideo();
    stopHeroVideo = null;
  }

  const header = document.querySelector('#page-header:not(.not-top-img)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!header || reducedMotion.matches) return;

  // 只给首页（full_page）和分类页加视频；文章页、关于页、工具页保持静态头图。
  if (!header.classList.contains('full_page') && !document.getElementById('category')) return;

  // Keep the static poster for data savers and slow connections; the video is decorative.
  const connection = navigator.connection || {};
  if (connection.saveData || /^(slow-2g|2g|3g)$/.test(connection.effectiveType || '')) return;

  const video = document.createElement('video');
  video.className = 'hero-video';
  video.setAttribute('aria-hidden', 'true');
  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  video.preload = 'none';

  // Cross just above 20% so exactly 80% out of view counts as paused.
  const playbackThreshold = 0.200001;
  let visibleEnough = false;

  function syncPlayback() {
    video.hidden = reducedMotion.matches;
    if (visibleEnough && !document.hidden && !reducedMotion.matches) video.play().catch(() => {});
    else video.pause();
  }

  const viewportObserver = new IntersectionObserver(entries => {
    visibleEnough = entries.at(-1).intersectionRatio >= playbackThreshold;
    syncPlayback();
  }, { threshold: playbackThreshold });

  function cleanup() {
    viewportObserver.disconnect();
    document.removeEventListener('visibilitychange', syncPlayback);
    reducedMotion.removeEventListener('change', syncPlayback);
    video.pause();
    video.remove();
  }
  stopHeroVideo = cleanup;

  video.addEventListener('playing', () => {
    video.classList.add('is-ready');
  }, { once: true });
  video.addEventListener('error', () => {
    cleanup();
    if (stopHeroVideo === cleanup) stopHeroVideo = null;
  });

  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener('change', syncPlayback);

  header.prepend(video);
  const compactViewport = window.matchMedia('(max-width: 600px)').matches;
  const compactVideo = header.classList.contains('full_page') ? 'hero-mika-mobile.mp4' : 'hero-mika-compact.mp4';
  video.src = '/img/' + (compactViewport ? compactVideo : 'hero-mika.mp4') + '?v=2k';
  viewportObserver.observe(header);
}

window.addEventListener('pjax:complete', startHeroVideo);
if (document.readyState === 'complete') startHeroVideo();
else window.addEventListener('load', startHeroVideo, { once: true });
