// আপনার নিজের ফায়ারবেস কনফিগারেশন এখানে পেস্ট করুন
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    // ... আপনার বাকি কনফিগারেশন
};

// ফায়ারবেস চালু করুন
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 'tasks' নোডের রেফারেন্স নিন
const tasksRef = database.ref('tasks/');
const tasksContainer = document.getElementById('tasks-container');

// ডেটাবেজ থেকে ডেটা আনার জন্য প্রস্তুত হোন
tasksRef.on('value', (snapshot) => {
    // কন্টেইনারটি প্রথমে খালি করুন
    tasksContainer.innerHTML = '';

    if (snapshot.exists()) {
        // ডেটা পাওয়া গেলে প্রতিটি টাস্কের জন্য লুপ চালান
        snapshot.forEach((childSnapshot) => {
            const taskData = childSnapshot.val();
            
            // প্রতিটি টাস্ক দেখানোর জন্য একটি কার্ড তৈরি করুন
            const taskCard = document.createElement('div');
            taskCard.classList.add('task-card'); // স্টাইল করার জন্য ক্লাস যোগ করা হলো

            taskCard.innerHTML = `
                <h3>${taskData.taskTitle}</h3>
                <p><strong>বিস্তারিত:</strong> ${taskData.taskDescription}</p>
                <p><strong>চ্যানেল:</strong> <a href="${taskData.channelUrl}" target="_blank">চ্যানেল দেখুন</a></p>
                <p class="reward-count">সাবস্ক্রাইবার প্রয়োজন: ${taskData.subscriberCount} জন</p>
            `;
            
            // কন্টেইনারে নতুন কার্ডটি যুক্ত করুন
            tasksContainer.appendChild(taskCard);
        });
    } else {
        // কোনো ডেটা না পাওয়া গেলে বার্তা দেখান
        tasksContainer.innerHTML = '<p style="text-align: center;">এখনো কোনো টাস্ক যোগ করা হয়নি।</p>';
    }
}, (error) => {
    console.error("ডেটা লোড করার সময় সমস্যা হয়েছে:", error);
    tasksContainer.innerHTML = '<p style="color: red; text-align: center;">ডেটা লোড করা যায়নি।</p>';
});