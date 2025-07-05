// 🔔 আপনার নিজের ফায়ারবেস কনফিগারেশন এখানে পেস্ট করুন
const firebaseConfig = {
  apiKey: "AIzaSyAC4h55aA0Zz--V5ejyndzR5WC_-9rAPio",
  authDomain: "subscribe-bot-6f9b2.firebaseapp.com",
  databaseURL: "https://subscribe-bot-6f9b2-default-rtdb.firebaseio.com",
  projectId: "subscribe-bot-6f9b2",
  storageBucket: "subscribe-bot-6f9b2.appspot.com",
  messagingSenderId: "141787931031",
  appId: "1:141787931031:web:2108a3e930f5ce4fbc64d2"
};

// ফায়ারবেস সার্ভিস চালু করুন
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();
const submitBtn = document.getElementById('submitBtn');

// --- YouTube API Config ---
// 🚨 এখানে আপনার ইউটিউব এপিআই কী বসান
const YOUTUBE_API_KEY = "AIzaSyD5wCkpL3LghaFrBf3YxGQ8I1ig1wbSn3A"; 

/**
 * URL থেকে চ্যানেল আইডি বা ইউজারনেম বের করে।
 * @param {string} url - The YouTube channel URL.
 * @returns {string|null}
 */
function getIdentifierFromUrl(url) {
    let match = url.match(/\/channel\/([a-zA-Z0-9_-]{24})/);
    if (match) return match[1];
    match = url.match(/\/(?:@|c\/|user\/)([a-zA-Z0-9_.-]+)/);
    if (match) return match[1];
    return null;
}

/**
 * ইউটিউব এপিআই ব্যবহার করে চ্যানেলের আইডি খুঁজে বের করে।
 * @param {string} identifier - The custom username from the URL.
 * @returns {Promise<string|null>}
 */
async function fetchChannelIdFromAPI(identifier) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=id&q=${encodeURIComponent(identifier)}&type=channel&key=${YOUTUBE_API_KEY}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return (data.items && data.items.length > 0) ? data.items[0].id.channelId : null;
    } catch (error) {
        console.error("YouTube API error:", error);
        return null;
    }
}

// --- মূল التنفيذ লজিক ---
auth.onAuthStateChanged(user => {
    if (user) {
        // ব্যবহারকারী লগইন করা থাকলে
        submitBtn.disabled = false;
        submitBtn.textContent = 'সাবমিট করুন';

        submitBtn.addEventListener('click', async function () {
            const currentUser = user;
            
            const url = document.getElementById('channelUrl').value.trim();
            const count = document.getElementById('subscriberCount').value;
            const title = document.getElementById('taskTitle').value.trim();
            const desc = document.getElementById('taskDescription').value.trim();

            if (!url || !count || !title || !desc) {
                alert('অনুগ্রহ করে সব ঘর পূরণ করুন।');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'পয়েন্ট চেক করা হচ্ছে...';

            const userPointsRef = database.ref(`users/${currentUser.uid}/points`);
            const userPointsSnap = await userPointsRef.once('value');
            const currentPoints = userPointsSnap.val() || 0;
            const taskCost = Number(count);

            if (currentPoints < taskCost) {
                alert(`দুঃখিত! এই টাস্কটির জন্য আপনার ${taskCost} পয়েন্ট প্রয়োজন। আপনার আছে ${currentPoints} পয়েন্ট।`);
                submitBtn.disabled = false;
                submitBtn.textContent = 'সাবমিট করুন';
                return;
            }
            
            submitBtn.textContent = 'চ্যানেল যাচাই করা হচ্ছে...';
            
            const identifier = getIdentifierFromUrl(url);
            if (!identifier) {
                alert('সঠিক ইউটিউব চ্যানেল লিঙ্ক দিন।');
                submitBtn.disabled = false;
                submitBtn.textContent = 'সাবমিট করুন';
                return;
            }

            let finalChannelId = null;
            let isIdFromCache = false;

            const cacheRef = database.ref(`allChannelIds/${identifier}`);
            const snapshot = await cacheRef.once('value');

            if (snapshot.exists()) {
                finalChannelId = snapshot.val();
                isIdFromCache = true;
            } else {
                if (identifier.startsWith('UC')) {
                     finalChannelId = identifier;
                } else {
                     finalChannelId = await fetchChannelIdFromAPI(identifier);
                }
            }
            
            if (!finalChannelId) {
                alert('এই চ্যানেলটি খুঁজে পাওয়া যায়নি।');
                submitBtn.disabled = false;
                submitBtn.textContent = 'সাবমিট করুন';
                return;
            }
            
            submitBtn.textContent = 'টাস্ক সেভ করা হচ্ছে...';

            const newPoints = currentPoints - taskCost;
            const newTaskRef = database.ref('tasks').push();
            const newTaskId = newTaskRef.key;

            const taskData = {
                taskId: newTaskId,
                ownerId: currentUser.uid,
                channelId: finalChannelId,
                title: title,
                description: desc,
                link: `http://googleusercontent.com/youtube.com/channel/${finalChannelId}`,
                completed: 0,
                max: Number(count),
                createdAt: new Date().toISOString()
            };
            
            const updates = {};
            updates[`/tasks/${newTaskId}`] = taskData;
            updates[`/users/${currentUser.uid}/points`] = newPoints;

            if (!isIdFromCache) {
                updates[`/allChannelIds/${identifier}`] = finalChannelId;
            }

            try {
                await database.ref().update(updates);
                alert(`টাস্ক সফলভাবে যোগ করা হয়েছে এবং আপনার অ্যাকাউন্ট থেকে ${taskCost} পয়েন্ট কাটা হয়েছে। ✅`);
                
                document.getElementById('channelUrl').value = '';
                document.getElementById('subscriberCount').value = '10';
                document.getElementById('taskTitle').value = '';
                document.getElementById('taskDescription').value = '';

            } catch (error) {
                console.error("ডেটা সেভ করার সময় সমস্যা হয়েছে:", error);
                alert('দুঃখিত! ডেটা সেভ করা যায়নি।');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'সাবমিট করুন';
            }
        });
    } else {
        // ব্যবহারকারী লগইন করা না থাকলে
        submitBtn.textContent = 'লগইন করুন';
        submitBtn.disabled = true;
    }
});