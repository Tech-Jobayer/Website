  <script>
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

    // লোডিং স্ক্রিন টাইমআউট
    let loadingTimeout = setTimeout(() => {
      document.getElementById("loadingScreen").style.display = "none";
      document.getElementById("dashboardContent").style.display = "block";
    }, 3000);

    // লগইন স্ট্যাটাস অনুযায়ী UI আপডেট
    auth.onAuthStateChanged(user => {
      if (user) {
        showUser(user);
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
      }
    });

    // Loading dots animation
    const loadingText = document.querySelector('.loading-text');
    let dotCount = 0;
    setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      loadingText.innerHTML = `অনুগ্রহ করে অপেক্ষা করুন${'.'.repeat(dotCount)}`;
    }, 500);
  </script>