// --- Drawer Control Functions ---
// Sidebar Drawer JS
document.getElementById('menuBtn').onclick = function() {
  document.getElementById('sidebar').style.width = "240px";
  // সাইডবার খুললে প্রোফাইল ড্রয়ার বন্ধ করুন
  document.getElementById('profileDrawer').style.width = "0";
  document.getElementById('profileDrawer').style.display = "none"; // নিশ্চিত করুন প্রোফাইল ড্রয়ার ডিসপ্লে না হয়
};

function closeSidebar() {
  document.getElementById('sidebar').style.width = "0";
}

// Profile Drawer JS
document.getElementById('profileBtn').onclick = function() {
  const profileDrawer = document.getElementById('profileDrawer');
  profileDrawer.style.display = "block"; // ড্রয়ার খোলার আগে এটি ডিসপ্লে করুন
  profileDrawer.style.width = "280px"; // প্রোফাইল ড্রয়ারের জন্য কিছুটা ভিন্ন প্রস্থ
  // প্রোফাইল ড্রয়ার খুললে সাইডবার বন্ধ করুন
  document.getElementById('sidebar').style.width = "0";
};

function closeProfileDrawer() {
  const profileDrawer = document.getElementById('profileDrawer');
  profileDrawer.style.width = "0";
  profileDrawer.style.display = "none"; // তাৎক্ষণিকভাবে ডিসপ্লে বন্ধ করুন
}

// Notification Drawer JS
document.getElementById('notifyBtn').onclick = function() {
  const notificationDrawer = document.getElementById('notificationDrawer');
  notificationDrawer.style.display = "block";
  notificationDrawer.style.width = "280px";
  // নোটিফিকেশন ড্রয়ার খুললে অন্য ড্রয়ার বন্ধ করুন
  document.getElementById('sidebar').style.width = "0";
  document.getElementById('profileDrawer').style.width = "0";
  document.getElementById('profileDrawer').style.display = "none";
  fetchAndDisplayNotifications(); // নোটিফিকেশন লোড ও ডিসপ্লে করুন
};

function closeNotificationDrawer() {
  const notificationDrawer = document.getElementById('notificationDrawer');
  notificationDrawer.style.width = "0";
  notificationDrawer.style.display = "none";
}


// --- Firebase Initialization & Core Functions ---
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
// const storage = firebase.storage(); // যদি প্রোফাইল পিকচার আপলোড ফাংশনালিটি যোগ করেন তাহলে এটি আনকমেন্ট করুন

function redirectToLogin() {
  const basePath = window.location.pathname.split('/')[1];
  window.location.href = `${location.origin}/${basePath}/login/`;
}

function logout() {
  auth.signOut().then(() => {
    document.getElementById('headerUserPoints').innerText = '';
    updateProfileDrawerUI(null); // লগআউট করার পর প্রোফাইল ড্রয়ারের তথ্য আপডেট করুন
    closeProfileDrawer(); // লগআউট হলে ড্রয়ার বন্ধ করুন
    location.reload(); // পৃষ্ঠা রিলোড করুন
  }).catch(error => {
    console.error("Logout error:", error);
  });
}

// --- User Data Loading Functions ---
function loadPoints(uid) {
  const headerUserPointsElement = document.getElementById('headerUserPoints');
  const drawerUserPointsElement = document.getElementById('drawerUserPoints');

  db.ref('users/' + uid + '/points').on('value', snap => {
    const points = snap.val() || 0;
    if (headerUserPointsElement) {
      headerUserPointsElement.innerHTML = `💰 ${points}`;
    }
    if (drawerUserPointsElement) {
      drawerUserPointsElement.innerHTML = `💰 ${points} পয়েন্ট`;
    }
  });
}

function loadTasks() {
  const list = document.getElementById("taskList");
  return db.ref('tasks').once('value')
    .then(snap => {
      const data = snap.val();
      list.innerHTML = '';
      if (!data) {
        list.innerHTML = "<p>😢 কোনো টাস্ক নেই</p>";
        return;
      }
      Object.entries(data).forEach(([key, ch]) => {
        // পার্সেন্টেজ গণনা করুন
        const percentage = Math.round((ch.completed / ch.max) * 100);

        const cardLink = document.createElement('a');
        cardLink.href = `${window.location.origin}/Website/dashboard/task.html?taskId=${encodeURIComponent(key)}`;
        cardLink.target = "_blank";
        cardLink.rel = "noopener noreferrer";
        cardLink.className = "card-link";
        cardLink.innerHTML = `
          <div class="card">
            <div class="card-header">
              <h3>${ch.title}</h3>
            </div>
            <p>সাবস্ক্রাইবার: ${ch.completed} / ${ch.max}</p>
            <div class="progress-container">
              <div class="progress-percentage">${percentage}%</div>
              <div class="progress">
                <div class="progress-bar" style="width: ${percentage}%"></div>
              </div>
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

// --- Notification Functions ---
function fetchAndDisplayNotifications() {
  const notificationList = document.getElementById('notificationList');
  notificationList.innerHTML = '<p class="no-notifications-message">নোটিফিকেশন লোড হচ্ছে...</p>'; // লোডিং মেসেজ

  db.ref('notifications').orderByChild('timestamp').once('value')
    .then(snapshot => {
      const notifications = [];
      snapshot.forEach(childSnapshot => {
        const notification = childSnapshot.val();
        notification.id = childSnapshot.key; // নোটিফিকেশন ID যোগ করুন
        notifications.unshift(notification); // নতুন নোটিফিকেশন উপরে দেখাতে
      });

      notificationList.innerHTML = ''; // পুরোনো লোডিং মেসেজ সরান

      if (notifications.length === 0) {
        notificationList.innerHTML = '<p class="no-notifications-message">কোনো নতুন নোটিফিকেশন নেই।</p>';
        return;
      }

      notifications.forEach(notif => {
        const notifItem = document.createElement('div');
        notifItem.className = `notification-item ${notif.read ? '' : 'unread'}`;
        notifItem.dataset.id = notif.id; // নোটিফিকেশন ID ডেটাসেটে রাখুন

        const date = new Date(notif.timestamp);
        const formattedTime = date.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
        const formattedDate = date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });

        notifItem.innerHTML = `
          <h4>${notif.title}</h4>
          <p>${notif.message}</p>
          <div class="timestamp">${formattedDate} ${formattedTime}</div>
        `;
        notifItem.addEventListener('click', () => markNotificationAsRead(notif.id, notifItem));
        notificationList.appendChild(notifItem);
      });
      updateNotificationBadge(); // নোটিফিকেশন ডিসপ্লে হওয়ার পর ব্যাজ আপডেট করুন
    })
    .catch(error => {
      console.error("নোটিফিকেশন লোড করতে সমস্যা হয়েছে:", error);
      notificationList.innerHTML = '<p class="no-notifications-message">নোটিফিকেশন লোড করতে সমস্যা হয়েছে।</p>';
    });
}

function updateNotificationBadge() {
  const currentUser = auth.currentUser;
  const notifyCountElement = document.querySelector('.notify-count'); // নোটিফিকেশন ব্যাজ এলিমেন্ট

  if (!currentUser) {
    // যদি কোনো ব্যবহারকারী লগইন করা না থাকে
    // এই ক্ষেত্রে আপনি সিদ্ধান্ত নিতে পারেন যে ডিফল্টভাবে কতগুলো নোটিফিকেশন দেখাবেন
    // অথবা ব্যাজটি খালি রাখবেন বা লুকিয়ে রাখবেন।
    setNotificationCount(0); // আপাতত ০ দেখাচ্ছি
    return;
  }

  const userId = currentUser.uid; // বর্তমান লগইন করা ব্যবহারকারীর UID

  db.ref('notifications').once('value') // সমস্ত নোটিফিকেশন লোড করুন
    .then(snapshot => {
      let unreadCount = 0;
      snapshot.forEach(childSnapshot => {
        const notification = childSnapshot.val();
        // প্রতিটি নোটিফিকেশনের ID পেতে
        notification.id = childSnapshot.key;

        // এই নোটিফিকেশনটি এই ব্যবহারকারী পড়েছে কিনা চেক করুন
        // যদি notification.readBy অবজেক্ট না থাকে OR
        // যদি notification.readBy অবজেক্ট থাকে কিন্তু তার মধ্যে এই userId এর জন্য true না থাকে
        const isReadByUser = notification.readBy && notification.readBy[userId];

        if (!isReadByUser) {
          // যদি এটি এই ব্যবহারকারীর জন্য আনরিড হয়
          unreadCount++;
        }
      });
      setNotificationCount(unreadCount); // নতুন কাউন্ট সেট করুন
    })
    .catch(error => {
      console.error("আনরিড নোটিফিকেশন গণনা করতে সমস্যা হয়েছে:", error);
      setNotificationCount(0); // এরর হলে ০ দেখান
    });
}

function markNotificationAsRead(notificationId, element) {
  db.ref(`notifications/${notificationId}`).update({ read: true })
    .then(() => {
      console.log(`নোটিফিকেশন ${notificationId} পঠিত হিসেবে চিহ্নিত হয়েছে।`);
      if (element) {
        element.classList.remove('unread'); // CSS ক্লাস সরান
        element.style.backgroundColor = ''; // ব্যাকগ্রাউন্ড রঙ রিসেট করুন
        element.querySelector('p').style.color = ''; // টেক্সট রঙ রিসেট করুন
        element.querySelector('.timestamp').style.color = ''; // টাইমস্ট্যাম্প রঙ রিসেট করুন
      }
      updateNotificationBadge(); // ব্যাজ আপডেট করুন
    })
    .catch(error => {
      console.error(`নোটিফিকেশন ${notificationId} পঠিত হিসেবে চিহ্নিত করতে সমস্যা হয়েছে:`, error);
    });
}


// --- Profile Image Handling ---
const headerProfileImgElement = document.getElementById('profileImg');
const drawerProfileImgElement = document.getElementById('drawerProfileImg');
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

// --- Profile Drawer UI Update ---
function updateProfileDrawerUI(user) {
  const drawerUserName = document.getElementById('drawerUserName');
  const drawerUserEmail = document.getElementById('drawerUserEmail');
  const drawerLoginSignupBtn = document.getElementById('drawerLoginSignupBtn');
  const drawerLogoutBtn = document.getElementById('drawerLogoutBtn');
  const drawerUserPoints = document.getElementById('drawerUserPoints'); // পয়েন্ট এলিমেন্ট পেতে

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
    drawerUserPoints.innerHTML = '💰 0 পয়েন্ট'; // লগইন না থাকলে ডিফল্ট পয়েন্ট
  }
}

// --- Global UI & Loading Logic ---
// লোডিং স্ক্রিন টাইমআউট
let loadingTimeout = setTimeout(() => {
  document.getElementById("loadingScreen").style.display = "none";
  document.getElementById("dashboardContent").style.display = "block";
  loadProfileImage(auth.currentUser);
 
// লোডিং স্ক্রিন টাইমআউট
let loadingTimeout = setTimeout(() => {
  document.getElementById("loadingScreen").style.display = "none";
  document.getElementById("dashboardContent").style.display = "block";
  loadProfileImage(auth.currentUser);
  updateProfileDrawerUI(auth.currentUser);
  closeProfileDrawer();
  if (!auth.currentUser) {
      document.getElementById('headerUserPoints').innerText = '';
  }
  updateNotificationBadge(); // এখানে যোগ করুন
}, 3000);

// auth.onAuthStateChanged এর ভেতরেও নিশ্চিত করুন যে এটি কল হচ্ছে
auth.onAuthStateChanged(user => {
  // ... (existing code) ...
  if (user) {
    // ... (existing code) ...
    updateNotificationBadge(); // এখানেও যোগ করুন
  } else {
    // ... (existing code) ...
    updateNotificationBadge(); // এবং এখানেও যোগ করুন
  }
});

// --- Utility Functions & Animations ---
// setNotificationCount ফাংশনটি আগের মতোই থাকবে
 updateProfileDrawerUI(auth.currentUser); // লোডিং শেষে ড্রয়ার UI আপডেট করুন
  closeProfileDrawer(); // নিশ্চিত করুন প্রোফাইল ড্রয়ার বন্ধ আছে যখন লোডিং শেষ হয়
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
    Promise.all([loadTasks()]) // লগইন থাকলে টাস্ক লোড করুন
      .then(() => {
        clearTimeout(loadingTimeout);
        document.getElementById("loadingScreen").style.display = "none";
        document.getElementById("dashboardContent").style.display = "block";
        closeProfileDrawer(); // নিশ্চিত করুন প্রোফাইল ড্রয়ার বন্ধ আছে যখন ইউজার লগইন করে
      })
      .catch((err) => {
        console.error("ড্যাশবোর্ড লোড সমস্যা:", err);
        clearTimeout(loadingTimeout);
        document.getElementById("loadingScreen").style.display = "none";
        document.getElementById("dashboardContent").style.display = "block";
        closeProfileDrawer(); // এরর হলেও বন্ধ করুন
      });
  } else {
    clearTimeout(loadingTimeout);
    document.getElementById("loadingScreen").style.display = "none";
    document.getElementById("dashboardContent").style.display = "block";
    // এই লাইনটি সরানো হয়েছে, যাতে লগইন না থাকলেও টাস্ক লোড হয়
    // document.getElementById("taskList").innerHTML = "<p class='task-message'>🔐 দয়া করে লগইন করুন, তারপর টাস্ক দেখতে পারবেন।</p>";
    loadTasks(); // লগইন না থাকলেও টাস্ক লোড করুন
    loadProfileImage(null);
    updateProfileDrawerUI(null);
    closeProfileDrawer(); // নিশ্চিত করুন প্রোফাইল ড্রয়ার বন্ধ আছে যখন ইউজার লগইন না থাকে
    if (headerUserPointsElement) {
        headerUserPointsElement.innerText = '';
    }
  }
});

// --- Utility Functions & Animations ---
// Loading dots animation
const loadingText = document.querySelector('.loading-text');
let dotCount = 0;
setInterval(() => {
  dotCount = (dotCount + 1) % 4;
  loadingText.innerHTML = `অনুগ্রহ করে অপেক্ষা করুন${'.'.repeat(dotCount)}`;
}, 500);

function setNotificationCount(count) {
  const notifyCount = document.querySelector('.notify-count');
  if (notifyCount) {
    notifyCount.textContent = count;
    notifyCount.style.display = count > 0 ? 'inline-block' : 'none';
  }
}
