// Sidebar Drawer JS
document.getElementById('menuBtn').onclick = function() {
  document.getElementById('sidebar').style.width = "240px";
};
function closeSidebar() {
  document.getElementById('sidebar').style.width = "0";
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
// const storage = firebase.storage(); // Firebase Storage SDK HTML এ যোগ করা থাকলে এটি ব্যবহার করতে পারেন

function redirectToLogin() {
  const basePath = window.location.pathname.split('/')[1];
  window.location.href = `${location.origin}/${basePath}/login/`;
}

function showUser(user) {
  document.getElementById("userArea").innerHTML = `
    👋 ${user.displayName || user.email} | 🔥 <span id="userPoints">Loading...</span> পয়েন্ট
    <br><button class="btn" onclick="logout()">🚪 Logout</button>
  `;
  loadPoints(user.uid);
}

function logout() {
  auth.signOut().then(() => location.reload());
}

function loadPoints(uid) {
  db.ref('users/' + uid + '/points').on('value', snap => {
    document.getElementById('userPoints').innerText = snap.val() || 0;
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

// --- প্রোফাইল আইকন লোডিং লজিক ---
const profileImgElement = document.getElementById('profileImg');
// HTML-এ সেট করা ডিফল্ট লোগোর URL
const defaultProfileImgUrl = "https://raw.githubusercontent.com/tech-jobayer/Website/main/data/default-profile.png";

function loadProfileImage(user) {
  if (user) {
    // ব্যবহারকারী লগইন করা থাকলে, তাদের কাস্টম প্রোফাইল ছবি ডেটাবেজ থেকে লোড করার চেষ্টা করুন
    db.ref(`users/${user.uid}/profilePictureUrl`).once('value')
      .then(snapshot => {
        const customImageUrl = snapshot.val();
        if (customImageUrl) {
          profileImgElement.src = customImageUrl; // কাস্টম লোগো থাকলে সেটি সেট করুন
        } else {
          profileImgElement.src = defaultProfileImgUrl; // কাস্টম লোগো না থাকলে ডিফল্ট সেট করুন
        }
      })
      .catch(error => {
        console.error("Error loading user profile picture:", error);
        profileImgElement.src = defaultProfileImgUrl; // ত্রুটি হলে ডিফল্ট সেট করুন
      });
  } else {
    // ব্যবহারকারী লগইন করা না থাকলে বা লগআউট করলে ডিফল্ট লোগো সেট করুন
    profileImgElement.src = defaultProfileImgUrl;
  }
}
// --- প্রোফাইল আইকন লোডিং লজিক শেষ ---


// লোডিং স্ক্রিন টাইমআউট
let loadingTimeout = setTimeout(() => {
  document.getElementById("loadingScreen").style.display = "none";
  document.getElementById("dashboardContent").style.display = "block";
  // যদি auth.onAuthStateChanged কল না হয়, তাহলে ডিফল্ট লোগো নিশ্চিত করুন
  loadProfileImage(auth.currentUser);
}, 3000);

// লগইন স্ট্যাটাস অনুযায়ী UI আপডেট
auth.onAuthStateChanged(user => {
  if (user) {
    showUser(user);
    loadProfileImage(user); // ব্যবহারকারী লগইন করলে প্রোফাইল ছবি লোড করুন
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
    document.getElementById("userArea").innerHTML = `
      <button class="btn" onclick="redirectToLogin()">🔐 Login / Signup</button>
    `;
    document.getElementById("taskList").innerHTML = "<p class='task-message'>🔐 দয়া করে লগইন করুন, তারপর টাস্ক দেখতে পারবেন।</p>";
    loadProfileImage(null); // ব্যবহারকারী লগইন না থাকলে ডিফল্ট প্রোফাইল ছবি লোড করুন
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

