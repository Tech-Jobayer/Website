// লোডিং ডিভ তৈরি
const loadingOverlay = document.createElement('div');
loadingOverlay.id = 'loadingOverlay';
loadingOverlay.innerHTML = `
  <div class="spinner"></div>
`;
document.body.appendChild(loadingOverlay);

// লোডিং দেখাও
function showLoading() {
  loadingOverlay.style.display = 'flex';
}

// লোডিং বন্ধ করো
function hideLoading() {
  loadingOverlay.style.display = 'none';
}

// পেজ ফুল লোড হলে লোডিং হাইড
window.addEventListener('load', () => {
  hideLoading();
});