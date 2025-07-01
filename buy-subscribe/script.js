// buy-subscription.js

// Firebase ইনিশিয়ালাইজেশন script.js থেকে আসবে।
// auth এবং db ভেরিয়েবলগুলো script.js থেকে উপলব্ধ হবে।

const channelUrlInput = document.getElementById('channelUrl');
const subscribersToBuyInput = document.getElementById('subscribersToBuy');
const totalCostSpan = document.getElementById('totalCost');
const addChannelBtn = document.getElementById('addChannelBtn');
const purchaseMessageDiv = document.getElementById('purchaseMessage');

const taskTitleInput = document.getElementById('taskTitle');
const taskDescriptionInput = document.getElementById('taskDescription');
const submitTaskDetailsBtn = document.getElementById('submitTaskDetailsBtn');
const taskDetailsMessageDiv = document.getElementById('taskDetailsMessage');

const purchasedChannelListDiv = document.getElementById('purchasedChannelList');
const myPurchasedChannelsCard = document.getElementById('myPurchasedChannels');
const backToDashboardBtn = document.getElementById('backToDashboardBtn');

const pricePerSubscriber = 10; // প্রতিটি সাবস্ক্রাইবারের জন্য প্রয়োজনীয় পয়েন্ট

// --- UI আপডেট ফাংশন ---
function updateCost() {
  const subscribers = parseInt(subscribersToBuyInput.value) || 0;
  totalCostSpan.innerText = (subscribers * pricePerSubscriber);
}

function showMessage(element, message, type) {
  element.innerText = message;
  element.className = `alert alert-${type}`;
  element.style.display = 'block';
  setTimeout(() => {
    element.style.display = 'none';
  }, 5000); // 5 সেকেন্ড পর মেসেজ লুকিয়ে ফেলুন
}

function showLoadingScreen() {
  document.getElementById("loadingScreen").style.display = "flex";
  document.getElementById("buySubscriptionContent").style.display = "none";
}

function hideLoadingScreen() {
  document.getElementById("loadingScreen").style.display = "none";
  document.getElementById("buySubscriptionContent").style.display = "block";
}

// --- ইভেন্ট লিসেনার ---
subscribersToBuyInput.addEventListener('input', updateCost);
addChannelBtn.addEventListener('click', purchaseSubscription);
submitTaskDetailsBtn.addEventListener('click', submitTaskDetails); // নতুন ইভেন্ট লিসেনার

// ড্যাশবোর্ডে ফিরে যাওয়ার বাটন
backToDashboardBtn.addEventListener('click', function() {
  const basePath = window.location.pathname.split('/')[1];
  window.location.href = `${location.origin}/${basePath}/dashboard/`; // ড্যাশবোর্ডে ফিরে যান
});

// --- Firebase এবং কোর লজিক ---
async function purchaseSubscription() {
  const user = auth.currentUser;
  if (!user) {
    showMessage(purchaseMessageDiv, 'দয়া করে লগইন করুন সাবস্ক্রিপশন কেনার জন্য।', 'danger');
    // redirectToLogin(); // হেডার না থাকায় লগইন বাটনের বদলে মেসেজ দেখানো হলো
    return;
  }

  const channelUrl = channelUrlInput.value.trim();
  const subscribersToBuy = parseInt(subscribersToBuyInput.value);

  // ইনপুট ভ্যালিডেশন
  if (!channelUrl) {
    document.getElementById('urlError').innerText = 'চ্যানেল URL প্রয়োজন।';
    return;
  } else {
    document.getElementById('urlError').innerText = '';
  }

  if (isNaN(subscribersToBuy) || subscribersToBuy <= 0) {
    document.getElementById('subscribersError').innerText = 'বৈধ সাবস্ক্রাইবার সংখ্যা দিন।';
    return;
  } else {
    document.getElementById('subscribersError').innerText = '';
  }

  showLoadingScreen();
  addChannelBtn.disabled = true;

  try {
    const userRef = db.ref(`users/${user.uid}`);
    const userSnapshot = await userRef.once('value');
    const userData = userSnapshot.val();
    const currentPoints = userData.points || 0;
    const requiredPoints = subscribersToBuy * pricePerSubscriber;

    if (currentPoints < requiredPoints) {
      showMessage(purchaseMessageDiv, `আপনার পর্যাপ্ত পয়েন্ট নেই। ${requiredPoints - currentPoints} পয়েন্ট কম আছে।`, 'danger');
      hideLoadingScreen();
      addChannelBtn.disabled = false;
      return;
    }

    // ট্রানজ্যাকশন ব্যবহার করে পয়েন্ট আপডেট করুন
    await userRef.transaction(currentData => {
      if (currentData) {
        currentData.points = (currentData.points || 0) - requiredPoints;
      }
      return currentData;
    });

    // চ্যানেলের ডেটাবেসে যোগ করুন বা আপডেট করুন
    const newChannelRef = db.ref('channels').push();
    const channelId = newChannelRef.key;

    await newChannelRef.set({
      url: channelUrl,
      completed: 0,
      max: subscribersToBuy,
      ownerId: user.uid,
      costPerSubscriber: pricePerSubscriber,
      purchasedAt: firebase.database.ServerValue.TIMESTAMP
      // এখানে title এবং description যুক্ত হবে যখন submitTaskDetails কল হবে
    });

    // ব্যবহারকারীর কেনা সাবস্ক্রিপশনের রেকর্ড রাখুন
    await db.ref(`users/${user.uid}/purchasedSubscriptions/${channelId}`).set({
      channelUrl: channelUrl,
      subscribersBought: subscribersToBuy,
      pointsSpent: requiredPoints,
      purchasedAt: firebase.database.ServerValue.TIMESTAMP,
      channelDbId: channelId // Firebase 'channels' নোডের আইডি সংরক্ষণ করা হলো
    });

    showMessage(purchaseMessageDiv, 'সাবস্ক্রিপশন সফলভাবে কেনা হয়েছে! এখন টাস্কের বিবরণ দিন।', 'success');
    channelUrlInput.value = '';
    subscribersToBuyInput.value = '10';
    updateCost();
    loadPurchasedChannels(user.uid); // কেনা চ্যানেলের তালিকা আপডেট করুন
    // loadPoints(user.uid); // হেডার না থাকায় এটি আর এখানে দরকার নেই, ড্যাশবোর্ডে এটি আপডেট হবে

  } catch (error) {
    console.error("সাবস্ক্রিপশন কেনার সমস্যা:", error);
    showMessage(purchaseMessageDiv, `সাবস্ক্রিপশন কেনার সময় একটি সমস্যা হয়েছে: ${error.message}`, 'danger');
  } finally {
    hideLoadingScreen();
    addChannelBtn.disabled = false;
  }
}

// --- টাস্কের বিস্তারিত সাবমিট করার ফাংশন ---
async function submitTaskDetails() {
  const user = auth.currentUser;
  if (!user) {
    showMessage(taskDetailsMessageDiv, 'দয়া করে লগইন করুন টাস্কের বিবরণ সাবমিট করার জন্য।', 'danger');
    return;
  }

  const taskTitle = taskTitleInput.value.trim();
  const taskDescription = taskDescriptionInput.value.trim();

  // ইনপুট ভ্যালিডেশন
  if (!taskTitle) {
    document.getElementById('titleError').innerText = 'টাস্ক টাইটেল প্রয়োজন।';
    return;
  } else {
    document.getElementById('titleError').innerText = '';
  }

  if (!taskDescription) {
    document.getElementById('descriptionError').innerText = 'টাস্কের বিস্তারিত বিবরণ প্রয়োজন।';
    return;
  } else {
    document.getElementById('descriptionError').innerText = '';
  }

  // একটি কেনা সাবস্ক্রিপশন আছে কিনা দেখুন
  const purchasedSnapshot = await db.ref(`users/${user.uid}/purchasedSubscriptions`).once('value');
  const purchasedData = purchasedSnapshot.val();

  if (!purchasedData) {
    showMessage(taskDetailsMessageDiv, 'কোনো কেনা সাবস্ক্রিপশন পাওয়া যায়নি যার জন্য টাস্ক বিবরণ যোগ করা যাবে। প্রথমে একটি সাবস্ক্রিপশন কিনুন।', 'danger');
    return;
  }

  // এখানে আমরা ধরে নিচ্ছি যে সর্বশেষ কেনা সাবস্ক্রিপশনের জন্য টাস্ক বিবরণ যোগ করা হচ্ছে।
  // যদি একাধিক কেনা সাবস্ক্রিপশন থাকে এবং ব্যবহারকারী নির্দিষ্ট একটিতে বিবরণ যোগ করতে চায়,
  // তাহলে একটি ড্রপডাউন বা তালিকা থেকে চ্যানেল নির্বাচনের ব্যবস্থা করতে হবে।
  // আপাতত, সর্বশেষ কেনা সাবস্ক্রিপশনটি খুঁজে বের করি।
  let latestChannelId = null;
  let latestPurchaseTime = 0;
  for (const key in purchasedData) {
      if (purchasedData[key].purchasedAt > latestPurchaseTime) {
          latestPurchaseTime = purchasedData[key].purchasedAt;
          latestChannelId = purchasedData[key].channelDbId; // এখানে চ্যানেল ID ব্যবহার করা হলো
      }
  }

  if (!latestChannelId) {
      showMessage(taskDetailsMessageDiv, 'কোনো কেনা সাবস্ক্রিপশন পাওয়া যায়নি যার জন্য টাস্ক বিবরণ যোগ করা যাবে।', 'danger');
      return;
  }

  showLoadingScreen();
  submitTaskDetailsBtn.disabled = true;

  try {
    // 'channels' নোডের মধ্যে সংশ্লিষ্ট চ্যানেল আপডেট করুন
    await db.ref(`channels/${latestChannelId}`).update({
      title: taskTitle,
      description: taskDescription,
      lastUpdated: firebase.database.ServerValue.TIMESTAMP
    });

    showMessage(taskDetailsMessageDiv, 'টাস্কের বিবরণ সফলভাবে আপডেট হয়েছে!', 'success');
    taskTitleInput.value = '';
    taskDescriptionInput.value = '';

  } catch (error) {
    console.error("টাস্ক বিবরণ সাবমিট করার সমস্যা:", error);
    showMessage(taskDetailsMessageDiv, `টাস্ক বিবরণ সাবমিট করার সময় একটি সমস্যা হয়েছে: ${error.message}`, 'danger');
  } finally {
    hideLoadingScreen();
    submitTaskDetailsBtn.disabled = false;
  }
}


// ব্যবহারকারীর কেনা চ্যানেল লোড করার ফাংশন
async function loadPurchasedChannels(uid) {
  purchasedChannelListDiv.innerHTML = '<p class="no-purchases-message">কেনা সাবস্ক্রিপশন লোড হচ্ছে...</p>';
  myPurchasedChannelsCard.style.display = 'block';

  try {
    const snapshot = await db.ref(`users/${uid}/purchasedSubscriptions`).once('value');
    const purchased = snapshot.val();
    purchasedChannelListDiv.innerHTML = '';

    if (!purchased) {
      purchasedChannelListDiv.innerHTML = '<p class="no-purchases-message">আপনি এখনো কোনো সাবস্ক্রিপশন কিনেননি।</p>';
      return;
    }

    Object.entries(purchased).forEach(async ([purchaseRecordId, data]) => {
      // Firebase 'channels' থেকে টাইটেল এবং URL আনুন
      const channelSnapshot = await db.ref(`channels/${data.channelDbId}`).once('value');
      const channelData = channelSnapshot.val();
      const channelTitle = channelData ? channelData.title : (data.channelUrl.split('/').pop() || 'আপনার চ্যানেল');
      const channelUrl = channelData ? channelData.url : data.channelUrl;


      const channelItem = document.createElement('div');
      channelItem.className = 'channel-item';
      const date = new Date(data.purchasedAt);
      const formattedDate = date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });

      channelItem.innerHTML = `
        <div>
          <h4>${channelTitle}</h4>
          <p>URL: <a href="${channelUrl}" target="_blank">${channelUrl}</a></p>
          <p>সাবস্ক্রাইবার কেনা হয়েছে: ${data.subscribersBought}</p>
          <p>খরচ হয়েছে: ${data.pointsSpent} পয়েন্ট</p>
          <p>কেনা হয়েছে: ${formattedDate}</p>
        </div>
      `;
      purchasedChannelListDiv.appendChild(channelItem);
    });
  } catch (error) {
    console.error("কেনা চ্যানেল লোড করতে সমস্যা হয়েছে:", error);
    purchasedChannelListDiv.innerHTML = '<p class="no-purchases-message">কেনা চ্যানেল লোড করতে সমস্যা হয়েছে।</p>';
  }
}

// --- ইনিশিয়ালাইজেশন ---
auth.onAuthStateChanged(user => {
  if (user) {
    // হেডার না থাকায় loadPoints, loadProfileImage, updateProfileDrawerUI এখানে দরকার নেই
    loadPurchasedChannels(user.uid);
    hideLoadingScreen();
  } else {
    hideLoadingScreen();
    showMessage(purchaseMessageDiv, 'সাবস্ক্রিপশন কেনার জন্য দয়া করে লগইন করুন।', 'info');
    showMessage(taskDetailsMessageDiv, 'টাস্কের বিবরণ যোগ করার জন্য দয়া করে লগইন করুন।', 'info');
    myPurchasedChannelsCard.style.display = 'none';
  }
});

// প্রাথমিক লোডিং স্ক্রিন দেখান এবং খরচ সেট করুন
showLoadingScreen();
updateCost();
