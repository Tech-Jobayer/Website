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

// ডেটাবেজের রেফারেন্স নিন
const database = firebase.database();

// সাবমিট বাটনের জন্য ইভেন্ট লিসেনার
document.getElementById('submitBtn').addEventListener('click', function () {
  // ইনপুট ফিল্ড থেকে ডেটা সংগ্রহ করুন
  const url = document.getElementById('channelUrl').value.trim();
  const count = document.getElementById('subscriberCount').value;
  const title = document.getElementById('taskTitle').value.trim();
  const desc = document.getElementById('taskDescription').value.trim();

  // সবগুলো ফিল্ড পূরণ করা হয়েছে কিনা তা পরীক্ষা করুন
 if (!url) {
    alert('চ্যানেলের লিংক বসান');
    return;
  } else if (!count) {
    alert('কত সাবস্ক্রাইব লাগবে তা বসান');
    return;
  } else if (!title) {
    alert('টাইটেল দিন');
    return;
  } else if (!desc) {
    alert('ডিসক্রিপশন লিখুন');
    return;
  }

  // ডেটাবেজে পাঠানোর জন্য একটি অবজেক্ট তৈরি করুন
  const taskData = {
    channelUrl: url,
    subscriberCount: Number(count),
    taskTitle: title,
    taskDescription: desc,
    createdAt: new Date().toISOString()
  };

  // 'tasks' নামের একটি কালেকশনে নতুন ডেটা পাঠান
  database.ref('rewards/').push(taskData)
    .then(() => {
      alert('আপনার টাস্ক সফলভাবে ডেটাবেজে সেভ হয়েছে! ✅');
      // সফল সাবমিটের পর ফর্ম খালি করে দিন (ঐচ্ছিক)
      document.getElementById('channelUrl').value = '';
      document.getElementById('subscriberCount').value = '10';
      document.getElementById('taskTitle').value = '';
      document.getElementById('taskDescription').value = '';
    })
    .catch((error) => {
      console.error("ডেটা সেভ করার সময় একটি সমস্যা হয়েছে:", error);
      alert('দুঃখিত! ডেটা সেভ করা যায়নি।');
    });
});