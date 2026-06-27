document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('menuBtn') || document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileMenu');

  if (btn && menu) {
    btn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });
  }
});
