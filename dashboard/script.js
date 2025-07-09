// --- Drawer Control Functions ---
// মেনু বাটন ক্লিক হ্যান্ডলার
document.getElementById('menuBtn').onclick = function() {
    openSidebar();
    closeProfileDrawer();
    closeNotificationDrawer();
};

function openSidebar() {
    document.getElementById('sidebar').style.width = "240px";
}

function closeSidebar() {
    document.getElementById('sidebar').style.width = "0";
}

// প্রোফাইল বাটন ক্লিক হ্যান্ডলার
document.getElementById('profileBtn').onclick = function() {
    openProfileDrawer();
    closeSidebar();
    closeNotificationDrawer();
};

function openProfileDrawer() {
    const profileDrawer = document.getElementById('profileDrawer');
    profileDrawer.style.display = "block"; // ড্রয়ার দৃশ্যমান করুন
    // ছোট বিরতি দিন যাতে 'display: block' কার্যকর হয় তারপর ট্রানজিশন শুরু হয়
    setTimeout(() => {
        profileDrawer.classList.add("open"); // CSS ট্রানজিশনের জন্য 'open' ক্লাস যোগ করুন
    }, 10);
    updateProfileUI(auth.currentUser); // প্রোফাইল UI আপডেট করুন
}

function closeProfileDrawer() {
    const profileDrawer = document.getElementById('profileDrawer');
    profileDrawer.classList.remove("open"); // 'open' ক্লাস সরিয়ে ড্রয়ার বন্ধ করুন
    // ট্রানজিশন শেষ হলে ড্রয়ার লুকিয়ে ফেলুন
    setTimeout(() => {
        profileDrawer.style.display = "none";
    }, 300); // CSS transition duration এর সাথে মিলিয়ে
}

// নোটিফিকেশন বাটন ক্লিক হ্যান্ডলার
document.getElementById('notifyBtn').onclick = function() {
    openNotificationDrawer();
    closeSidebar();
    closeProfileDrawer();
    fetchAndDisplayNotifications(); // নোটিফিকেশন লোড করুন
};

function openNotificationDrawer() {
    const notificationDrawer = document.getElementById('notificationDrawer');
    notificationDrawer.style.display = "block"; // ড্রয়ার দৃশ্যমান করুন
    // ছোট বিরতি দিন যাতে 'display: block' কার্যকর হয় তারপর ট্রানজিশন শুরু হয়
    setTimeout(() => {
        notificationDrawer.classList.add("open"); // CSS ট্রানজিশনের জন্য 'open' ক্লাস যোগ করুন
    }, 10);
}

function closeNotificationDrawer() {
    const notificationDrawer = document.getElementById('notificationDrawer');
    notificationDrawer.classList.remove("open"); // 'open' ক্লাস সরিয়ে ড্রয়ার বন্ধ করুন
    // ট্রানজিশন শেষ হলে ড্রয়ার লুকিয়ে ফেলুন
    setTimeout(() => {
        notificationDrawer.style.display = "none";
    }, 300); // CSS transition duration এর সাথে মিলিয়ে
}

// closeDrawerBtn (প্রোফাইল ড্রয়ারের বন্ধ করুন বাটন)
document.getElementById("closeDrawerBtn").addEventListener("click", () => {
    closeProfileDrawer();
});


// --- Firebase Initialization & Core Functions ---
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

function logout() {
    auth.signOut().catch(error => console.error("Logout error:", error));
}


// --- Data Loading and Display Functions ---
function loadPoints(uid) {
    const headerPointsEl = document.getElementById('headerUserPoints');
    const drawerPointsEl = document.getElementById('drawerUserPoints');
    const userPointsRef = db.ref(`users/${uid}/points`);

    userPointsRef.on('value', snap => {
        const points = snap.val() || 0;
        if (headerPointsEl) headerPointsEl.innerHTML = `💰 ${points}`;
        if (drawerPointsEl) drawerPointsEl.innerHTML = `💰 ${points} পয়েন্ট`;
    });
}

// লোডিং স্ক্রিন ফাংশন
function showLoading() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.style.display = 'flex';
  }
}

function hideLoading() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
}


const YOUTUBE_API_KEY = "AIzaSyD5wCkpL3LghaFrBf3YxGQ8I1ig1wbSn3A"; // Security risk: Consider server-side proxy
let currentUserId = null;

function getTaskId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('taskId');
}

function extractChannelId(url) {
  const match = url.match(/(?:youtube\.com\/(?:channel\/|user\/|c\/)|youtu\.be\/|youtube\.com\/watch\?v=.*?&channel=)([\w-]{24}|[\w-]+)/);
  return match ? match[1] : null;
}

async function getYouTubeSubscriberCount(channelId, apiKey) {
  const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&fields=items%2Fstatistics%2FsubscriberCount&key=${apiKey}`;
  const response = await fetch(apiUrl);
  const data = await response.json();
  if (response.ok && data.items?.length > 0) {
    return parseInt(data.items[0].statistics.subscriberCount);
  } else {
    throw new Error("সাবস্ক্রাইবার ডেটা লোড করা যায়নি।");
  }
}


function loadTaskDetail(taskId) {
  showLoading();

  if (!taskId) {
    document.getElementById('taskDetail').innerHTML = "<p>টাস্ক আইডি পাওয়া যায়নি।</p>";
    hideLoading();
    return;
  }

  db.ref('tasks/' + taskId).once('value')
    .then(snap => {
      const ch = snap.val();
      if (!ch) {
        document.getElementById('taskDetail').innerHTML = "<p>টাস্ক পাওয়া যায়নি।</p>";
        hideLoading();
        return;
      }

      const taskDetailDiv = document.getElementById('taskDetail');
      taskDetailDiv.innerHTML = `
        <h3>${ch.title}</h3>
        <p><strong>সাবস্ক্রাইবার:</strong> <span id="currentCompleted">${ch.completed}</span> / ${ch.max}</p>
        <div class="progress"><div class="progress-bar" style="width: ${(ch.completed / ch.max) * 100}%"></div></div>
        <p style="margin-top: 15px;">${ch.description || "বিস্তারিত তথ্য উপলব্ধ নেই।"}</p>
        <div id="initialButtons" style="margin-top: 20px;">
          <button id="showChannelLinkBtn" class="btn btn-primary">চ্যানেলের লিংক</button>
          <a href="index.html" class="btn btn-danger" style="margin-left: 10px;">⬅️ ড্যাশবোর্ডে ফিরে যাও</a>
        </div>
        <div id="channelLinkSection" style="display: none; margin-top: 20px;"></div>
        <div id="confirmationSection" style="display: none; margin-top: 20px;"></div>
      `;

      hideLoading();

      const showChannelLinkBtn = document.getElementById('showChannelLinkBtn');
      const channelLinkSection = document.getElementById('channelLinkSection');
      const confirmationSection = document.getElementById('confirmationSection');
      const currentCompletedSpan = document.getElementById('currentCompleted');

      showChannelLinkBtn.addEventListener('click', async () => {
        if (!currentUserId) {
          alert('অনুগ্রহ করে লগইন করুন।');
          return;
        }

        document.getElementById('initialButtons').style.display = 'none';
        channelLinkSection.style.display = 'block';

        try {
          const channelId = extractChannelId(ch.link);
          if (!channelId) {
            alert('চ্যানেল আইডি পাওয়া যায়নি।');
            return;
          }

          const beforeCount = await getYouTubeSubscriberCount(channelId, YOUTUBE_API_KEY);

          await db.ref('users/' + currentUserId + '/taskProgress/' + taskId).set({
            beforeCount,
            status: 'started',
            startTime: firebase.database.ServerValue.TIMESTAMP
          });

          channelLinkSection.innerHTML = `
            <p>চ্যানেলের লিংক: <a href="${ch.link}" target="_blank">${ch.link}</a></p>
            <p id="beforeCountDisplay">🔢 সাবস্ক্রাইবার সংখ্যা (শুরুর সময়): ${beforeCount}</p>
            <a href="${ch.link}" target="_blank" class="btn btn-primary" style="margin-top: 10px;">➡️ সাবস্ক্রাইব করতে এখানে ক্লিক করো</a>
            <button id="doneBtn" class="btn btn-success" style="margin-left: 10px;">Done ✅</button>
          `;

          document.getElementById('doneBtn').addEventListener('click', () => {
            channelLinkSection.style.display = 'none';
            confirmationSection.style.display = 'block';
            confirmationSection.innerHTML = `
              <p>আপনি কি সত্যিই সাবস্ক্রাইব করেছেন?</p>
              <button id="iHaveSubscribedBtn" class="btn btn-success">আমি সাবস্ক্রাইব করেছি</button>
            `;

            document.getElementById('iHaveSubscribedBtn').addEventListener('click', async () => {
              try {
                const taskProgressSnap = await db.ref('users/' + currentUserId + '/taskProgress/' + taskId).once('value');
                const progress = taskProgressSnap.val();
                if (!progress || progress.status !== 'started') {
                  alert('আপনার টাস্ক শুরু হয়নি।');
                  return;
                }

                const newCount = await getYouTubeSubscriberCount(channelId, YOUTUBE_API_KEY);
                confirmationSection.innerHTML += `<p>🔁 বর্তমান সাবস্ক্রাইবার সংখ্যা: ${newCount}</p>`;

                const difference = newCount - progress.beforeCount;
                if (difference > 0) {
                  confirmationSection.innerHTML += `<p style="color:green;">🎉 সাবস্ক্রাইব বেড়েছে: ${difference} জন</p>`;

                  await Promise.all([
                    db.ref('tasks/' + taskId).transaction(data => {
                      if (data && data.completed < data.max) {
                        data.completed += 1;
                      }
                      return data;
                    }),
                    db.ref('users/' + currentUserId + '/points').transaction(points => (points || 0) + 1),
                    db.ref('users/' + currentUserId + '/taskProgress/' + taskId).update({
                      status: 'completed',
                      completionTime: firebase.database.ServerValue.TIMESTAMP
                    })
                  ]);

                  db.ref('tasks/' + taskId).once('value').then(updatedSnap => {
                    const updated = updatedSnap.val();
                    if (updated) {
                      currentCompletedSpan.textContent = updated.completed;
                      document.querySelector('.progress-bar').style.width = `${(updated.completed / updated.max) * 100}%`;
                    }
                  });

                  alert('✅ সাবস্ক্রিপশন সফল! আপনাকে 1 পয়েন্ট দেওয়া হয়েছে।');
                  window.location.href = 'index.html';
                } else {
                  confirmationSection.innerHTML += `<p style="color:red;">⚠️ সাবস্ক্রাইব সংখ্যা বাড়েনি। অনুগ্রহ করে সাবস্ক্রাইব করুন।</p>`;
                  alert('সাবস্ক্রাইব নিশ্চিত হয়নি। আবার চেষ্টা করুন।');
                }
              } catch (err) {
                console.error(err);
                alert('সমস্যা হয়েছে। আবার চেষ্টা করুন।');
              }
            });
          });

        } catch (error) {
          console.error(error);
          alert('সাবস্ক্রাইবার সংখ্যা লোড করতে ব্যর্থ।');
        }
      });
    })
    .catch(err => {
      console.error(err);
      document.getElementById('taskDetail').innerHTML = "<p>ডেটা লোড করতে সমস্যা হয়েছে।</p>";
      hideLoading();
    });
}


// --- UI Update & Page Load Logic ---
const defaultProfileImgUrl = "https://raw.githubusercontent.com/tech-jobayer/Website/main/data/default-profile.png";

function updateProfileUI(user) {
    const headerImg = document.getElementById('profileImg');
    const drawerImg = document.getElementById('drawerProfileImg');
    const drawerName = document.getElementById('drawerUserName');
    const drawerEmail = document.getElementById('drawerUserEmail');
    const loginBtn = document.getElementById('drawerLoginSignupBtn');
    const logoutBtn = document.getElementById('drawerLogoutBtn');
    const drawerPoints = document.getElementById('drawerUserPoints');
    const headerPoints = document.getElementById('headerUserPoints');

    if (user) {
        const imageUrl = user.photoURL || defaultProfileImgUrl;
        if(headerImg) headerImg.src = imageUrl;
        if(drawerImg) drawerImg.src = imageUrl;
        if(drawerName) drawerName.innerText = user.displayName || 'User';
        if(drawerEmail) drawerEmail.innerText = user.email;
        if(loginBtn) loginBtn.style.display = 'none';
        if(logoutBtn) logoutBtn.style.display = 'block';
        loadPoints(user.uid);
    } else {
        if(headerImg) headerImg.src = defaultProfileImgUrl;
        if(drawerImg) drawerImg.src = defaultProfileImgUrl;
        if(drawerName) drawerName.innerText = 'Guest User';
        if(drawerEmail) drawerEmail.innerText = 'আপনি লগইন করেননি';
        if(loginBtn) loginBtn.style.display = 'block';
        if(logoutBtn) logoutBtn.style.display = 'none';
        if(drawerPoints) drawerPoints.innerHTML = '💰 0 পয়েন্ট';
        if(headerPoints) headerPoints.innerHTML = '';
    }
}

// --- Notification Functions ---
function setNotificationCount(count) {
    const notifyCountSpan = document.querySelector('.notify-count');
    if (notifyCountSpan) {
        notifyCountSpan.textContent = count > 0 ? count : 0;
        // যদি নোটিফিকেশন না থাকে তাহলে ব্যাজটি লুকিয়ে রাখতে পারেন
        notifyCountSpan.style.display = count > 0 ? 'flex' : 'none';
    }
}

function fetchAndDisplayNotifications() {
    const notificationList = document.getElementById('notificationList');
    notificationList.innerHTML = '<p class="no-notifications-message">লোড হচ্ছে...</p>';
    const userId = auth.currentUser ? auth.currentUser.uid : null;

    if (!userId) {
        notificationList.innerHTML = '<p class="no-notifications-message">নোটিফিকেশন দেখতে লগইন করুন।</p>';
        return;
    }

    db.ref('notifications').orderByChild('timestamp').limitToLast(20).once('value')
        .then(snapshot => {
            const notifications = [];
            snapshot.forEach(child => {
                const notif = child.val();
                notif.id = child.key;
                notifications.unshift(notif);
            });

            notificationList.innerHTML = '';
            if (notifications.length === 0) {
                notificationList.innerHTML = '<p class="no-notifications-message">কোনো নতুন নোটিফিকেশন নেই।</p>';
                return;
            }

            notifications.forEach(notif => {
                const isRead = userId && notif.readBy && notif.readBy[userId];
                const notifItem = document.createElement('div');
                notifItem.className = `notification-item ${isRead ? '' : 'unread'}`;
                notifItem.onclick = () => markNotificationAsRead(notif.id, notifItem);

                const date = new Date(notif.timestamp);
                const formattedTime = date.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
                const formattedDate = date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' });

                notifItem.innerHTML = `
                    <h4>${notif.title}</h4>
                    <p>${notif.message}</p>
                    <div class="timestamp">${formattedDate}, ${formattedTime}</div>`;
                notificationList.appendChild(notifItem);
            });
        })
        .catch(error => {
            console.error("নোটিফিকেশন লোড সমস্যা:", error);
            notificationList.innerHTML = '<p class="no-notifications-message">লোড করতে সমস্যা হয়েছে।</p>';
        });
}

function updateNotificationBadge() {
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    if (!userId) {
        setNotificationCount(0);
        return;
    }
    // রিয়েলটাইম আপডেটের জন্য .on() ব্যবহার করা ভালো
    db.ref('notifications').on('value', snapshot => {
        let unreadCount = 0;
        snapshot.forEach(child => {
            const notif = child.val();
            if (!notif.readBy || !notif.readBy[userId]) {
                unreadCount++;
            }
        });
        setNotificationCount(unreadCount);
    });
}

function markNotificationAsRead(notificationId, element) {
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    if (!userId) return; // লগইন করা না থাকলে কিছুই করবেনা

    const readRef = db.ref(`notifications/${notificationId}/readBy/${userId}`);
    readRef.set(true)
        .then(() => {
            if (element) element.classList.remove('unread');
            updateNotificationBadge(); // নোটিফিকেশন পঠিত হলে ব্যাজ আপডেট করুন
        })
        .catch(error => console.error(`নোটিফিকেশন পঠিত হিসেবে চিহ্নিত করতে সমস্যা:`, error));
}
