// loading.js

// লোডিং ডিভ তৈরি ও DOM এ অ্যাড করা
const loadingOverlay = document.createElement('div');
loadingOverlay.id = 'loadingOverlay';
loadingOverlay.innerHTML = `<div class="spinner"></div>`;
document.body.appendChild(loadingOverlay);

// লোডিং দেখানোর ফাংশন
function showLoading() {
  loadingOverlay.style.display = 'flex';
}

// লোডিং হাইড করার ফাংশন
function hideLoading() {
  loadingOverlay.style.display = 'none';
}