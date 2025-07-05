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

// ফায়ারবেস চালু করুন
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const submitBtn = document.getElementById('submitBtn');

// --- YouTube API Config ---
const YOUTUBE_API_KEY = "AIzaSyD5wCkpL3LghaFrBf3YxGQ8I1ig1wbSn3A"; // 🚨 এখানে আপনার ইউটিউব এপিআই কী বসান

/**
 * URL থেকে চ্যানেল আইডি বা ইউজারনেম বের করে।
 * @param {string} url - The YouTube channel URL.
 * @returns {string|null}
 */
function getIdentifierFromUrl(url) {
    // স্ট্যান্ডার্ড URL ফরম্যাট: /channel/UC...
    let match = url.match(/\/channel\/([a-zA-Z0-9_-]{24})/);
    if (match) return match[1];

    // কাস্টম ইউজারনেম URL: /@username, /c/username, /user/username
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
        if (data.items && data.items.length > 0) {
            return data.items[0].id.channelId; // চ্যানেল আইডি রিটার্ন করুন
        }
        return null;
    } catch (error) {
        console.error("YouTube API error:", error);
        return null;
    }
}

// --- মূল সাবমিট ফাংশন ---
submitBtn.addEventListener('click', async function () {
    const url = document.getElementById('channelUrl').value.trim();
    const count = document.getElementById('subscriberCount').value;
    const title = document.getElementById('taskTitle').value.trim();
    const desc = document.getElementById('taskDescription').value.trim();

    if (!url || !count || !title || !desc) {
        alert('অনুগ্রহ করে সব ঘর পূরণ করুন।');
        return;
    }
    
    submitBtn.disabled = true;
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

    // ১. প্রথমে আমাদের নিজস্ব ডেটাবেস চেক করুন
    const cacheRef = database.ref(`allChannelIds/${identifier}`);
    const snapshot = await cacheRef.once('value');

    if (snapshot.exists()) {
        finalChannelId = snapshot.val(); // ক্যাশ থেকে আইডি নিন
        isIdFromCache = true;
        console.log("চ্যানেল আইডি ডেটাবেস থেকে পাওয়া গেছে।");
    } else {
        // ২. যদি ডেটাবেসে না থাকে, তবেই API কল করুন
        console.log("ডেটাবেসে আইডি নেই, API কল করা হচ্ছে...");
        if (identifier.startsWith('UC')) {
             finalChannelId = identifier; // যদি শনাক্তকারী নিজেই একটি আইডি হয়
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

    const newTaskRef = database.ref('tasks').push();
    const newTaskId = newTaskRef.key;

    const taskData = {
        taskId: newTaskId,
        channelId: finalChannelId,
        title: title,
        description: desc,
        link: `https://www.youtube.com/channel/${finalChannelId}`,
        completed: 0,
        max: Number(count),
        createdAt: new Date().toISOString()
    };
    
    const updates = {};
    updates[`/tasks/${newTaskId}`] = taskData; // নতুন টাস্ক সবসময় সেভ হবে

    // ৩. যদি আইডি ক্যাশে না থাকে, তবেই `allChannelIds`-এ সেভ করুন
    if (!isIdFromCache) {
        updates[`/allChannelIds/${identifier}`] = finalChannelId;
    }

    try {
        await database.ref().update(updates);
        alert('আপনার টাস্ক সফলভাবে যোগ করা হয়েছে! ✅');
        // ফর্ম রিসেট
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