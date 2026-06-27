(function() {
  window.togglePasswordVisibility = function(id) {
    const input = document.getElementById(id);
    if (!input) return;
    const container = input.parentElement;
    const btn = container.querySelector('.password-toggle-btn');
    if (!btn) return;
    const showIcon = btn.querySelector('.show-icon');
    const hideIcon = btn.querySelector('.hide-icon');
    
    if (input.type === 'password') {
      input.type = 'text';
      showIcon.classList.add('hidden');
      hideIcon.classList.remove('hidden');
    } else {
      input.type = 'password';
      showIcon.classList.remove('hidden');
      hideIcon.classList.add('hidden');
    }
  };
})();
