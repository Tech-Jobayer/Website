let loadingInterval;

function showLoading() {
  const screen = document.getElementById('loadingScreen');
  if (!screen) return;

  screen.style.display = 'flex';

  const loadingText = screen.querySelector('.loading-text');
  let dotCount = 0;

  // ক্লিয়ার আগে যেকোন আগের interval (রিফ্রেশের জন্য)
  if (loadingInterval) clearInterval(loadingInterval);

  loadingInterval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    loadingText.textContent = `অনুগ্রহ করে অপেক্ষা করুন${'.'.repeat(dotCount)}`;
  }, 500);
}

function hideLoadingAfterMinimumTime() {
  const screen = document.getElementById('loadingScreen');
  if (!screen) return;

  const loadEndTime = Date.now();
  const timeSinceStart = loadEndTime - window.__loadingStartTime;
  const delay = Math.max(0, 1000 - timeSinceStart); // কমপক্ষে ১ সেকেন্ড লোডিং থাকবে

  setTimeout(() => {
    screen.style.display = 'none';
    if (loadingInterval) clearInterval(loadingInterval);
  }, delay);
}

window.addEventListener('load', hideLoadingAfterMinimumTime);