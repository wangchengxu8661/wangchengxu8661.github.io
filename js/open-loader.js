/* 开屏加载层：首屏进度条（每次会话只出现一次），加载完成后玻璃淡出。 */
(function () {
  'use strict';

  var KEY = 'xur0n-splash-seen';
  try {
    if (sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, '1');
  } catch (error) {
    /* 隐私模式下 sessionStorage 不可用：直接不显示，避免反复遮屏 */
    return;
  }

  var root = document.documentElement;
  var splash = document.createElement('div');
  splash.id = 'open-loader';
  splash.setAttribute('aria-hidden', 'true');
  splash.innerHTML =
    '<div class="ol-bg"></div>' +
    '<div class="ol-veil"></div>' +
    '<div class="ol-panel">' +
    '<p class="ol-title">Xur0nの小屋</p>' +
    '<div class="ol-track"><span class="ol-fill"></span></div>' +
    '<p class="ol-meta"><span class="ol-percent">0%</span><span class="ol-hint">正在布置画面</span></p>' +
    '</div>';

  var fill;
  var percent;
  var progress = 0;
  var finished = false;
  var timer;
  var shownAt = 0;
  var MIN_SHOW = 700;

  function paint() {
    if (!fill) return;
    fill.style.width = progress + '%';
    percent.textContent = Math.round(progress) + '%';
  }

  function finish() {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    // 加载太快时不闪一下就走，至少展示一小会儿
    var wait = Math.max(0, MIN_SHOW - (Date.now() - shownAt));
    window.setTimeout(function () {
      progress = 100;
      paint();
      root.classList.remove('ol-lock');
      splash.classList.add('ol-done');
      window.setTimeout(function () {
        if (splash.parentNode) splash.parentNode.removeChild(splash);
      }, 700);
    }, wait);
  }

  function mount() {
    if (!document.body) return;
    shownAt = Date.now();
    document.body.appendChild(splash);
    fill = splash.querySelector('.ol-fill');
    percent = splash.querySelector('.ol-percent');
    paint();
    root.classList.add('ol-lock');
    timer = window.setInterval(function () {
      if (finished) return;
      progress += Math.max(0.5, (92 - progress) * 0.05);
      if (progress > 92) progress = 92;
      paint();
    }, 110);
  }

  // DOM 就绪后再挂载，避免和解析抢跑
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  window.addEventListener('load', finish);
  // 安全阀：资源卡住也不会一直挡着
  window.setTimeout(finish, 9000);
  // 从往返缓存恢复时立刻撤掉
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) finish();
  });
})();
