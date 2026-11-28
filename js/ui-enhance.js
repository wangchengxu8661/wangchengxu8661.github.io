'use strict';

/* ============================================================================
   交互微调：当前导航高亮、文章阅读进度条、卡片柔光指针追踪。
   零外部依赖，兼容 Butterfly PJAX 局部切页，并遵循 prefers-reduced-motion。
   ========================================================================= */
(function initUiEnhance() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  function normalizePath(raw) {
    if (!raw) return '/';
    try {
      const url = new URL(raw, window.location.origin);
      let pathname = decodeURIComponent(url.pathname);
      pathname = pathname.replace(/\/index\.html$/i, '/');
      if (!pathname.endsWith('/')) pathname += '/';
      return pathname;
    } catch {
      return '/';
    }
  }

  /* ---------- 1. 导航栏当前页高亮 ---------- */
  function highlightActiveNav() {
    const currentPath = normalizePath(window.location.pathname);
    // 文章页时，同时匹配所属分类的导航项
    const postCategoryLink = document.querySelector('#post-info a.post-meta-categories');
    const postCategoryPath = postCategoryLink ? normalizePath(postCategoryLink.getAttribute('href')) : null;
    const isHome = currentPath === '/' || /^\/page\/\d+\/$/.test(currentPath);

    const navLinks = document.querySelectorAll('#nav .menus_item > a.site-page, #sidebar-menus .menus_item > a.site-page');
    for (const link of navLinks) {
      const href = normalizePath(link.getAttribute('href'));
      const matched =
        (href === '/' && isHome) ||
        (href !== '/' && (currentPath === href || currentPath.startsWith(href))) ||
        (postCategoryPath && href === postCategoryPath);
      link.classList.toggle('is-active', Boolean(matched));
      if (matched) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
  }

  /* ---------- 2. 文章页顶部阅读进度条 ---------- */
  let bar = document.getElementById('reading-progress');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'reading-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
  }

  let progressRaf = 0;
  function updateReadingProgress() {
    progressRaf = 0;
    const post = document.getElementById('post');
    if (!post) {
      bar.classList.remove('is-visible');
      bar.style.transform = 'scaleX(0)';
      return;
    }
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    bar.classList.toggle('is-visible', window.scrollY > 40);
    bar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
  }

  function scheduleProgress() {
    if (!progressRaf) progressRaf = window.requestAnimationFrame(updateReadingProgress);
  }

  window.addEventListener('scroll', scheduleProgress, { passive: true });
  window.addEventListener('resize', scheduleProgress, { passive: true });

  /* ---------- 3. 卡片指针镜面反光（仅桌面精准指针 & 非减弱动效） ---------- */
  const GLOW_SELECTOR = '#recent-posts .recent-post-item, #aside-content .card-widget, #article-container .flink .flink-list-item';
  let activeCard = null;
  let glowRaf = 0;
  let pointerX = 0;
  let pointerY = 0;

  function paintGlow() {
    glowRaf = 0;
    if (!activeCard) return;
    const rect = activeCard.getBoundingClientRect();
    activeCard.style.setProperty('--mx', Math.round(pointerX - rect.left) + 'px');
    activeCard.style.setProperty('--my', Math.round(pointerY - rect.top) + 'px');
  }

  document.addEventListener('pointermove', event => {
    if (reducedMotion.matches || !finePointer.matches) return;
    const card = event.target instanceof Element ? event.target.closest(GLOW_SELECTOR) : null;
    if (!card) {
      activeCard = null;
      return;
    }
    activeCard = card;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!glowRaf) glowRaf = window.requestAnimationFrame(paintGlow);
  }, { passive: true });

  function syncPage() {
    highlightActiveNav();
    updateReadingProgress();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncPage);
  else syncPage();
  window.addEventListener('pjax:complete', syncPage);
})();
