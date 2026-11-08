'use strict';

function startHeroVideo() {
  const header = document.querySelector('#page-header.full_page');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!header || reducedMotion.matches) return;

  const video = document.createElement('video');
  video.className = 'home-hero-video';
  video.setAttribute('aria-hidden', 'true');
  video.muted = true;
  video.playsInline = true;
  video.loop = true;

  const toggle = document.createElement('button');
  toggle.className = 'home-hero-toggle';
  toggle.type = 'button';
  toggle.hidden = true;
  toggle.textContent = '暂停背景';

  video.addEventListener('playing', () => {
    video.classList.add('is-ready');
    toggle.hidden = reducedMotion.matches;
    toggle.textContent = '暂停背景';
  });
  video.addEventListener('pause', () => { toggle.textContent = '播放背景'; });
  video.addEventListener('error', () => {
    video.remove();
    toggle.remove();
  });

  function play() {
    video.play().catch(() => {});
  }

  toggle.addEventListener('click', () => {
    if (video.paused) play();
    else video.pause();
  });
  reducedMotion.addEventListener('change', () => {
    video.hidden = reducedMotion.matches;
    toggle.hidden = reducedMotion.matches || !video.classList.contains('is-ready');
    if (reducedMotion.matches) video.pause();
  });

  header.prepend(video);
  header.append(toggle);
  video.src = '/img/hero-wind.mp4';
  play();
}

if (document.readyState === 'complete') startHeroVideo();
else window.addEventListener('load', startHeroVideo, { once: true });
