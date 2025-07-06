// loading.js
function showLoadingScreen() {
  if (document.getElementById('loadingScreen')) return;

  const div = document.createElement('div');
  div.id = 'loadingScreen';
  div.innerHTML = `
    <div class="spinner"></div>
    <div class="loading-text">অনুগ্রহ করে অপেক্ষা করুন</div>
  `;
  document.body.appendChild(div);

  // Optional: animated dots
  const loadingText = div.querySelector('.loading-text');
  let dotCount = 0;
  setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    loadingText.textContent = `অনুগ্রহ করে অপেক্ষা করুন${'.'.repeat(dotCount)}`;
  }, 500);
}

function hideLoadingScreen() {
  const screen = document.getElementById('loadingScreen');
  if (screen) screen.style.display = 'none';
}

window.addEventListener('load', () => {
  hideLoadingScreen();
});