// No imports to avoid dependency issues
console.log('Main script loaded');

const msg = document.getElementById('msg');
if (msg) {
  msg.innerHTML = 'Script principal executado com sucesso! <br> Se você vê isso, o ambiente está pronto.';
  msg.style.color = 'green';
  msg.style.fontWeight = 'bold';
}

const title = document.getElementById('title');
if (title) {
  title.style.color = '#10b981';
}

// Check if React is available globally (it shouldn't be, but just in case)
console.log('React global:', window.React);
