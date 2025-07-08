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
    const db = firebase.database();
    const YOUTUBE_API_KEY = "AIzaSyD5wCkpL3LghaFrBf3YxGQ8I1ig1wbSn3A";
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

    function showLoading() {
      document.getElementById('loadingScreen').style.display = 'flex';
    }

    function hideLoading() {
      document.getElementById('loadingScreen').style.display = 'none';
    }

    function loadTaskDetail(taskId) {
      showLoading();

      if (!taskId) {
        document.getElementById('taskDetail').innerHTML = "<p>টাস্ক আইডি পাওয়া যায়নি।</p>";
        hideLoading();
        return;
      }

      document.getElementById("profileDrawer").classList.add("open");

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

    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        currentUserId = user.uid;
        loadTaskDetail(getTaskId());
      } else {
  
document.getElementById("closeDrawerBtn").addEventListener("click", () => {
  document.getElementById("profileDrawer").classList.remove("open");
});      document.getElementById('taskDetail').innerHTML = "<p>এই টাস্কটি দেখতে হলে আপনাকে লগইন করতে হবে।</p>";
      }
    });