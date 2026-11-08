'use strict';

async function copyCode(text) {
  if (window.isSecureContext && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Clipboard API requires HTTPS. Keep copying available on the temporary HTTP/IP site.
  const field = document.createElement('textarea');
  field.value = text;
  field.readOnly = true;
  field.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  if (!copied) throw new Error('Clipboard unavailable');
}

function enableKeyboardControls() {
  for (const original of document.querySelectorAll('i.copy-button')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = original.className;
    button.setAttribute('aria-label', '复制代码');
    button.title = '复制代码';
    original.replaceWith(button);
    button.addEventListener('click', async event => {
      event.stopPropagation();
      const figure = button.closest('figure.highlight');
      const lines = figure ? [...figure.querySelectorAll('.code .line')] : [];
      const text = lines.length ? lines.map(line => line.textContent).join('\n') :
        (figure?.querySelector('.code pre, pre code')?.innerText || '');
      try {
        await copyCode(text);
        button.dataset.copyState = 'success';
        button.setAttribute('aria-label', '已复制');
        button.title = '已复制';
        button.classList.replace('fa-paste', 'fa-check');
      } catch {
        button.dataset.copyState = 'error';
        button.setAttribute('aria-label', '复制失败，请手动选择代码');
        button.title = '复制失败，请手动选择代码';
      }
      setTimeout(() => {
        button.setAttribute('aria-label', '复制代码');
        button.title = '复制代码';
        button.classList.replace('fa-check', 'fa-paste');
      }, 1800);
    });
  }
  const menu = document.getElementById('toggle-menu');
  if (menu && !menu.dataset.keyboardReady) {
    menu.dataset.keyboardReady = 'true';
    menu.setAttribute('role', 'button');
    menu.tabIndex = 0;
    menu.setAttribute('aria-label', '打开导航菜单');
    menu.title = '打开导航菜单';
    menu.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        menu.click();
      }
    });
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enableKeyboardControls);
else enableKeyboardControls();
window.addEventListener('load', enableKeyboardControls);
