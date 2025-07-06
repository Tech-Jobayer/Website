// 🔄 লোডিং DOM ও CSS অটো ইনজেক্ট করবে

(function () {
  // HTML Structure
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loadingOverlay';
  loadingDiv.className = 'loading-overlay';
  loadingDiv.style.display = 'none';
  loadingDiv.innerHTML = `
    <div class="spinner"></div>
    <p>লোড হচ্ছে...</p>
  `;
  document.body.appendChild(loadingDiv);

  // CSS Styling
  const style = document.createElement('style');
  style.innerHTML = `
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.8);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: sans-serif;
    }

    .loading-overlay p {
      margin-top: 10px;
      color: #333;
      font-size: 16px;
    }

    .spinner {
      border: 5px solid #ccc;
      border-top: 5px solid #3c8dbc;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  // Global Functions
  window.showLoading = function () {
    document.getElementById('loadingOverlay').style.display = 'flex';
  };

  window.hideLoading = function () {
    document.getElementById('loadingOverlay').style.display = 'none';
  };
})();
