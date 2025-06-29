// Sidebar Drawer JS
document.getElementById('menuBtn').onclick = function() {
  document.getElementById('sidebar').style.width = "240px";
  // সাইডবার খুললে প্রোফাইল ড্রয়ার বন্ধ করুন
  document.getElementById('profileDrawer').style.width = "0";
};

function closeSidebar() {
  document.getElementById('sidebar').style.width = "0";
}

// Profile Drawer JS
document.getElementById('profileBtn').onclick = function() {
  document.getElementById('profileDrawer').style.width = "280px"; // প্রোফাইল ড্রয়ারের জন্য কিছুটা ভিন্ন প্রস্থ
  // প্রোফাইল ড্রয়ার খুললে সাইডবার বন্ধ করুন
  document.getElementById('sidebar').style.width = "0";
};

function closeProfileDrawer() {
  document.getElementById('profileDrawer').style.width = "0";
}

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAC4h55aA0Zz--V5ejyndzR5WC_-9rAPio",
  authDomain: "subscribe-bot-6f9b2.firebaseapp.com",
  databaseURL: "https://subscribe-bot-6f9b2-default-rtdb.firebaseio.com",
  projectId: "subscribe-bot-6f9b2",
  storageBucket: "subscribe-bot-6f9b2.appspot.com",
  messagingSenderId: "141787931031",
  appId: "1:141787931031:web:2108a3e930f5ce4fbc64d2"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

function redirectToLogin() {
  const basePath = window.location.pathname.split('/')[1];
  window.location.href = `${location.origin}/${basePath}/login/`;
}

function logout() {
  auth.signOut().then(() => {
    document.getElementById('headerUserPoints').innerText = '';
    // লগআউট করার পর প্রোফাইল ড্রয়ারের তথ্য আপডেট করুন
    updateProfileDrawerUI(null);
    closeProfileDrawer(); // লগআউট হলে ড্রয়ার বন্ধ করুন
    location.reload(); // পৃষ্ঠা রিলোড করুন
  }).catch(error => {
    console.error("Logout error:", error);
  });
}

function loadPoints(uid) {
  const headerUserPointsElement = document.getElementById('headerUserPoints');
  const drawerUserPointsElement = document.getElementById('drawerUserPoints'); // নতুন: ড্রয়ারের পয়েন্ট এলিমেন্ট

  db.ref('users/' + uid + '/points').on('value', snap => {
    const points = snap.val() || 0;
    if (headerUserPointsElement) {
      headerUserPointsElement.innerHTML = `${points} 💰`;
    }
    if (drawerUserPointsElement) { // ড্রয়ারের পয়েন্ট আপডেট করুন
      drawerUserPointsElement.innerHTML = `🔥 ${points} পয়েন্ট`; // এখানে আপনি 🔥 আইকন যোগ করতে পারেন
    }
  });
}

function loadTasks() {
  const list = document.getElementById("taskList");
  return db.ref('channels').once('value')
    .then(snap => {
      const data = snap.val();
      list.innerHTML = '';
      if (!data) {
        list.innerHTML = "<p>😢 কোনো টাস্ক নেই</p>";
        return;
      }
      Object.entries(data).forEach(([key, ch]) => {
        const cardLink = document.createElement('a');
        cardLink.href = `${window.location.origin}/Website/dashboard/task.html?taskId=${encodeURIComponent(key)}`;
        cardLink.target = "_blank";
        cardLink.rel = "noopener noreferrer";
        cardLink.className = "card-link";
        cardLink.innerHTML = `
          <div class="card">
            <h3>${ch.title}</h3>
            <p>সাবস্ক্রাইবার: ${ch.completed} / ${ch.max}</p>
            <div class="progress">
              <div class="progress-bar" style="width: ${(ch.completed / ch.max) * 100}%"></div>
            </div>
          </div>
        `;
        list.appendChild(cardLink);
      });
    })
    .catch(err => {
      console.error("টাস্ক লোড সমস্যা:", err);
      list.innerHTML = "<p>❌ টাস্ক লোড করতে সমস্যা হয়েছে</p>";
    });
}

// --- প্রোফাইল আইকন লোডিং লজিক (হেডার এবং ড্রয়ারের জন্য) ---
const headerProfileImgElement = document.getElementById('profileImg'); // হেডারের প্রোফাইল ছবি
const drawerProfileImgElement = document.getElementById('drawerProfileImg'); // ড্রয়ারের প্রোফাইল ছবি
const defaultProfileImgUrl = "https://raw.githubusercontent.com/tech-jobayer/Website/main/data/default-profile.png";

function loadProfileImage(user) {
  const imgElements = [headerProfileImgElement, drawerProfileImgElement];

  if (user) {
    db.ref(`users/${user.uid}/profilePictureUrl`).once('value')
      .then(snapshot => {
        const customImageUrl = snapshot.val();
        imgElements.forEach(imgEl => {
          if (imgEl) {
            imgEl.src = customImageUrl || defaultProfileImgUrl;
          }
        });
      })
      .catch(error => {
        console.error("Error loading user profile picture:", error);
        imgElements.forEach(imgEl => {
          if (imgEl) {
            imgEl.src = defaultProfileImgUrl;
          }
        });
      });
  } else {
    imgElements.forEach(imgEl => {
      if (imgEl) {
        imgEl.src = defaultProfileImgUrl;
      }
    });
  }
}
// --- প্রোফাইল আইকন লোডিং লজিক শেষ ---

// --- প্রোফাইল ড্রয়ার UI আপডেট ফাংশন ---
function updateProfileDrawerUI(user) {
  const drawerUserName = document.getElementById('drawerUserName');
  const drawerUserEmail = document.getElementById('drawerUserEmail');
  const drawerLoginSignupBtn = document.getElementById('drawerLoginSignupBtn');
  const drawerLogoutBtn = document.getElementById('drawerLogoutBtn');

  if (user) {
    drawerUserName.innerText = user.displayName || 'User';
    drawerUserEmail.innerText = user.email;
    drawerLoginSignupBtn.style.display = 'none';
    drawerLogoutBtn.style.display = 'block';
    loadPoints(user.uid); // লগইন থাকলে ড্রয়ারের পয়েন্ট লোড করুন
  } else {
    drawerUserName.innerText = 'Guest User';
    drawerUserEmail.innerText = 'Not logged in';
    drawerLoginSignupBtn.style.display = 'block';
    drawerLogoutBtn.style.display = 'none';
    document.getElementById('drawerUserPoints').innerHTML = '🔥 0 পয়েন্ট'; // লগইন না থাকলে ডিফল্ট পয়েন্ট
  }
}
// --- প্রোফাইল ড্রয়ার UI আপডেট ফাংশন শেষ ---


// লোডিং স্ক্রিন টাইমআউট
let loadingTimeout = setTimeout(() => {
  document.getElementById("loadingScreen").style.display = "none";
  document.getElementById("dashboardContent").style.display = "block";
  loadProfileImage(auth.currentUser);
  updateProfileDrawerUI(auth.currentUser); // লোডিং শেষে ড্রয়ার UI আপডেট করুন
  // ব্যবহারকারী লগইন না থাকলে হেডারের পয়েন্ট অংশ খালি করে দিন
  if (!auth.currentUser) {
      document.getElementById('headerUserPoints').innerText = '';
  }
}, 3000);

// লগইন স্ট্যাটাস অনুযায়ী UI আপডেট
auth.onAuthStateChanged(user => {
  const headerUserPointsElement = document.getElementById('headerUserPoints');

  if (user) {
    loadProfileImage(user);
    updateProfileDrawerUI(user); // authStateChanged এ ড্রয়ার UI আপডেট করুন
    loadPoints(user.uid);
    Promise.all([loadTasks()])
      .then(() => {
        clearTimeout(loadingTimeout);
        document.getElementById("loadingScreen").style.display = "none";
        document.getElementById("dashboardContent").style.display = "block";
      })
      .catch((err) => {
        console.error("ড্যাশবোর্ড লোড সমস্যা:", err);
        clearTimeout(loadingTimeout);
        document.getElementById("loadingScreen").style.display = "none";
        document.getElementById("dashboardContent").style.display = "block";
      });
  } else {
    clearTimeout(loadingTimeout);
    document.getElementById("loadingScreen").style.display = "none";
    document.getElementById("dashboardContent").style.display = "block";
    document.getElementById("taskList").innerHTML = "<p class='task-message'>🔐 দয়া করে লগইন করুন, তারপর টাস্ক দেখতে পারবেন।</p>";
    loadProfileImage(null);
    updateProfileDrawerUI(null); // authStateChanged এ ড্রয়ার UI আপডেট করুন
    if (headerUserPointsElement) {
        headerUserPointsElement.innerText = '';
    }
  }
});

// Loading dots animation
const loadingText = document.querySelector('.loading-text');
let dotCount = 0;
setInterval(() => {
  dotCount = (dotCount + 1) % 4;
  loadingText.innerHTML = `অনুগ্রহ করে অপেক্ষা করুন${'.'.repeat(dotCount)}`;
}, 500);

// উদাহরণ: notification count ডাইনামিকভাবে সেট করা
function setNotificationCount(count) {
  const notifyCount = document.querySelector('.notify-count');
  if (notifyCount) {
    notifyCount.textContent = count;
    notifyCount.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

// ডেমো: ৫ সেকেন্ড পর badge সংখ্যা বাড়বে
setTimeout(() => {
  setNotificationCount(7);
}, 5000);
