function showLoading() {
  const screen = document.getElementById('loadingScreen');
  if (screen) screen.style.display = 'flex';

  const loadingText = screen.querySelector('.loading-text');
  let dotCount = 0;
  setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    loadingText.textContent = `অনুগ্রহ করে অপেক্ষা করুন${'.'.repeat(dotCount)}`;
  }, 500);
}

function hideLoadingAfterMinimumTime() {
  const screen = document.getElementById('loadingScreen');
  if (!screen) return;

  const loadEndTime = Date.now();
  const timeSinceStart = loadEndTime - window.__loadingStartTime;
  const delay = Math.max(0, 1000 - timeSinceStart); // ১ সেকেন্ডের কম হলে বাকি সময় অপেক্ষা করবে

  setTimeout(() => {
    screen.style.display = 'none';
  }, delay);
}

window.addEventListener('load', hideLoadingAfterMinimumTime);