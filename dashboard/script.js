// --- Drawer Control Functions ---
document.getElementById('menuBtn').onclick = function() {
    document.getElementById('sidebar').style.width = "240px";
    closeProfileDrawer();
    closeNotificationDrawer();
};

function closeSidebar() {
    document.getElementById('sidebar').style.width = "0";
}

document.getElementById('profileBtn').onclick = function() {
    document.getElementById('profileDrawer').style.display = "block";
    setTimeout(() => { document.getElementById('profileDrawer').style.width = "280px"; }, 10);
    closeSidebar();
    closeNotificationDrawer();
};

function closeProfileDrawer() {
    document.getElementById('profileDrawer').style.width = "0";
    setTimeout(() => { document.getElementById('profileDrawer').style.display = "none"; }, 300);
}

document.getElementById('notifyBtn').onclick = function() {
    document.getElementById('notificationDrawer').style.display = "block";
    setTimeout(() => { document.getElementById('notificationDrawer').style.width = "280px"; }, 10);
    closeSidebar();
    closeProfileDrawer();
    fetchAndDisplayNotifications();
};

function closeNotificationDrawer() {
    document.getElementById('notificationDrawer').style.width = "0";
    setTimeout(() => { document.getElementById('notificationDrawer').style.display = "none"; }, 300);
}


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

function loadTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = `<p>টাস্ক লোড হচ্ছে...</p>`; // প্রাথমিক লোডিং বার্তা

    db.ref('tasks').once('value')
        .then(snap => {
            const data = snap.val();
            list.innerHTML = '';
            if (!data) {
                list.innerHTML = "<p class='task-message'>😢 কোনো টাস্ক নেই</p>";
                return;
            }
            Object.entries(data).forEach(([key, ch]) => {
                const percentage = ch.max > 0 ? Math.round((ch.completed / ch.max) * 100) : 0;
                const cardLink = document.createElement('a');
                cardLink.href = `./Website/task_details/?taskId=${encodeURIComponent(key)}`;
                cardLink.target = "_blank";
                cardLink.rel = "noopener noreferrer";
                cardLink.className = "card-link";
                cardLink.innerHTML = `
                    <div class="card">
                        <div class="card-header"><h3>${ch.title}</h3></div>
                        <p>সাবস্ক্রাইবার: ${ch.completed} / ${ch.max}</p>
                        <div class="progress-container">
                            <div class="progress-percentage">${percentage}%</div>
                            <div class="progress"><div class="progress-bar" style="width: ${percentage}%"></div></div>
                        </div>
                    </div>`;
                list.appendChild(cardLink);
            });
        })
        .catch(err => {
            console.error("টাস্ক লোড সমস্যা:", err);
            list.innerHTML = "<p class='task-message'>❌ টাস্ক লোড করতে সমস্যা হয়েছে</p>";
        });
}


// --- Notification Functions ---
function fetchAndDisplayNotifications() {
    const notificationList = document.getElementById('notificationList');
    notificationList.innerHTML = '<p class="no-notifications-message">লোড হচ্ছে...</p>';
    const userId = auth.currentUser ? auth.currentUser.uid : null;

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
                notificationList.innerHTML = '<p class="no-notifications-message">কোনো নোটিফিকেশন নেই।</p>';
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
        })
        .catch(error => console.error(`নোটিফিকেশন পঠিত হিসেবে চিহ্নিত করতে সমস্যা:`, error));
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

// --- Main Execution Logic ---
function showContent() {
    document.getElementById("loadingScreen").style.display = "none";
    document.getElementById("dashboardContent").style.display = "block";
}

// একটি নির্দিষ্ট সময় পর লোডিং স্ক্রিন সরানোর জন্য ফলব্যাক
const loadingFallback = setTimeout(showContent, 4000);

auth.onAuthStateChanged(user => {
    clearTimeout(loadingFallback); // অথ স্ট্যাটাস পেলে ফলব্যাক বন্ধ করুন
    updateProfileUI(user);
    updateNotificationBadge();
    loadTasks(); // ব্যবহারকারী লগইন থাকুক বা না থাকুক, টাস্ক লোড করুন
    showContent();
});

// Loading dots animation
const loadingText = document.querySelector('.loading-text');
if (loadingText) {
    let dotCount = 0;
    setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        loadingText.innerHTML = `অনুগ্রহ করে অপেক্ষা করুন${'.'.repeat(dotCount)}`;
    }, 500);
}

function setNotificationCount(count) {
    const notifyCount = document.querySelector('.notify-count');
    if (notifyCount) {
        notifyCount.textContent = count;
        notifyCount.style.display = count > 0 ? 'inline-block' : 'none';
    }
}