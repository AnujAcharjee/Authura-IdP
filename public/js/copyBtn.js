document.addEventListener('click', async function (e) {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;

  const targetId = btn.getAttribute('data-copy-target');
  const targetEl = document.getElementById(targetId);
  if (!targetEl) return;

  const textToCopy = targetEl.innerText;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    // UI feedback
    const originalText = btn.innerText;
    btn.innerText = 'Copied ✓';
    setTimeout(() => (btn.innerText = originalText), 1500);
  } catch (err) {
    console.error('Copy failed:', err);
  }
});


<div class="relative">
  <pre id="codeBlock1" class="text-xs font-mono">
const example = "Hello World";
  </pre>

  <button 
    class="copy-btn absolute top-2 right-2 text-xs bg-slate-700 text-white px-2 py-1 rounded"
    data-copy-target="codeBlock1">
    Copy
  </button>
</div>