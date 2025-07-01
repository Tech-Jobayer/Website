document.getElementById('submitBtn').addEventListener('click', function () {
  const url = document.getElementById('channelUrl').value.trim();
  const count = document.getElementById('subscriberCount').value.trim();
  const title = document.getElementById('taskTitle').value.trim();
  const desc = document.getElementById('taskDescription').value.trim();

  if (!url || !count || !title || !desc) {
    alert('সব ঘর পূরণ করুন');
    return;
  }

  console.log("চ্যানেল URL:", url);
  console.log("সাবস্ক্রাইবার সংখ্যা:", count);
  console.log("টাস্ক টাইটেল:", title);
  console.log("টাস্ক বিস্তারিত:", desc);

  alert('ফর্ম সফলভাবে সাবমিট হয়েছে ✅');
});