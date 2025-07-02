// 🔔 আপনার নিজের ফায়ারবেস কনফিগারেশন এখানে পেস্ট করুন
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
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
  if (!url || !count || !title || !desc) {
    alert('অনুগ্রহ করে সব ঘর পূরণ করুন');
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
  database.ref('tasks/').push(taskData)
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