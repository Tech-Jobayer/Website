// buy-subscription.js

// Firebase ইনিশিয়ালাইজেশন script.js থেকে আসবে, তাই এখানে পুনরায় করার দরকার নেই।
// auth এবং db ভেরিয়েবলগুলো script.js থেকে উপলব্ধ হবে।

const channelUrlInput = document.getElementById('channelUrl');
const subscribersToBuyInput = document.getElementById('subscribersToBuy');
const totalCostSpan = document.getElementById('totalCost');
const addChannelBtn = document.getElementById('addChannelBtn');
const purchaseMessageDiv = document.getElementById('purchaseMessage');
const purchasedChannelListDiv = document.getElementById('purchasedChannelList');
const myPurchasedChannelsCard = document.getElementById('myPurchasedChannels');

const pricePerSubscriber = 10; // প্রতিটি সাবস্ক্রাইবারের জন্য প্রয়োজনীয় পয়েন্ট

// --- UI আপডেট ফাংশন ---
function updateCost() {
  const subscribers = parseInt(subscribersToBuyInput.value) || 0;
  totalCostSpan.innerText = (subscribers * pricePerSubscriber);
}

function showMessage(message, type) {
  purchaseMessageDiv.innerText = message;
  purchaseMessageDiv.className = `alert alert-${type}`;
  purchaseMessageDiv.style.display = 'block';
  setTimeout(() => {
    purchaseMessageDiv.style.display = 'none';
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

// ফিরে যাওয়ার বাটন
document.getElementById('backBtn').onclick = function() {
  const basePath = window.location.pathname.split('/')[1];
  window.location.href = `${location.origin}/${basePath}/dashboard/`; // ড্যাশবোর্ডে ফিরে যান
};

// --- Firebase এবং কোর লজিক ---
async function purchaseSubscription() {
  const user = auth.currentUser;
  if (!user) {
    showMessage('দয়া করে লগইন করুন সাবস্ক্রিপশন কেনার জন্য।', 'danger');
    redirectToLogin();
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
  addChannelBtn.disabled = true; // বাটন অক্ষম করুন

  try {
    const userRef = db.ref(`users/${user.uid}`);
    const userSnapshot = await userRef.once('value');
    const userData = userSnapshot.val();
    const currentPoints = userData.points || 0;
    const requiredPoints = subscribersToBuy * pricePerSubscriber;

    if (currentPoints < requiredPoints) {
      showMessage(`আপনার পর্যাপ্ত পয়েন্ট নেই। ${requiredPoints - currentPoints} পয়েন্ট কম আছে।`, 'danger');
      hideLoadingScreen();
      addChannelBtn.disabled = false;
      return;
    }

    // ট্রানজ্যাকশন ব্যবহার করে পয়েন্ট আপডেট করুন যাতে কনকারেন্সি সমস্যা না হয়
    await userRef.transaction(currentData => {
      if (currentData) {
        currentData.points = (currentData.points || 0) - requiredPoints;
      }
      return currentData;
    });

    // চ্যানেলের ডেটাবেসে যোগ করুন বা আপডেট করুন
    // এখানে একটি সাধারণ ID তৈরি করা হচ্ছে, আপনি চাইলে YouTube Channel ID ব্যবহার করতে পারেন
    const newChannelRef = db.ref('channels').push();
    const channelId = newChannelRef.key;

    await newChannelRef.set({
      title: `চ্যানেল ${channelId.substring(1, 5)}`, // আপাতত একটি সাধারণ টাইটেল
      url: channelUrl,
      completed: 0, // নতুন কেনা সাবস্ক্রিপশনের জন্য শুরুটা ০
      max: subscribersToBuy,
      ownerId: user.uid,
      costPerSubscriber: pricePerSubscriber,
      purchasedAt: firebase.database.ServerValue.TIMESTAMP
    });

    // ব্যবহারকারীর কেনা সাবস্ক্রিপশনের রেকর্ড রাখুন
    await db.ref(`users/${user.uid}/purchasedSubscriptions/${channelId}`).set({
      channelUrl: channelUrl,
      subscribersBought: subscribersToBuy,
      pointsSpent: requiredPoints,
      purchasedAt: firebase.database.ServerValue.TIMESTAMP
    });

    showMessage('সাবস্ক্রিপশন সফলভাবে কেনা হয়েছে!', 'success');
    channelUrlInput.value = '';
    subscribersToBuyInput.value = '10';
    updateCost();
    loadPurchasedChannels(user.uid); // কেনা চ্যানেলের তালিকা আপডেট করুন
    loadPoints(user.uid); // হেডারের পয়েন্ট আপডেট করুন

  } catch (error) {
    console.error("সাবস্ক্রিপশন কেনার সমস্যা:", error);
    showMessage(`সাবস্ক্রিপশন কেনার সময় একটি সমস্যা হয়েছে: ${error.message}`, 'danger');
  } finally {
    hideLoadingScreen();
    addChannelBtn.disabled = false;
  }
}

// ব্যবহারকারীর কেনা চ্যানেল লোড করার ফাংশন
async function loadPurchasedChannels(uid) {
  purchasedChannelListDiv.innerHTML = '<p class="no-purchases-message">কেনা সাবস্ক্রিপশন লোড হচ্ছে...</p>';
  myPurchasedChannelsCard.style.display = 'block'; // কার্ডটি দেখান

  try {
    const snapshot = await db.ref(`users/${uid}/purchasedSubscriptions`).once('value');
    const purchased = snapshot.val();
    purchasedChannelListDiv.innerHTML = '';

    if (!purchased) {
      purchasedChannelListDiv.innerHTML = '<p class="no-purchases-message">আপনি এখনো কোনো সাবস্ক্রিপশন কিনেননি।</p>';
      return;
    }

    Object.entries(purchased).forEach(([channelId, data]) => {
      const channelItem = document.createElement('div');
      channelItem.className = 'channel-item';
      const date = new Date(data.purchasedAt);
      const formattedDate = date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });

      channelItem.innerHTML = `
        <div>
          <h4>${data.channelUrl.split('/').pop() || 'আপনার চ্যানেল'}</h4>
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
    loadPoints(user.uid); // হেডারের পয়েন্ট লোড করুন
    loadProfileImage(user); // প্রোফাইল ছবি লোড করুন
    loadPurchasedChannels(user.uid); // কেনা চ্যানেল লোড করুন
    hideLoadingScreen();
  } else {
    // লগইন না থাকলে
    document.getElementById('headerUserPoints').innerText = '';
    loadProfileImage(null);
    hideLoadingScreen();
    // লগইন করার জন্য একটি বার্তা দেখাতে পারেন
    showMessage('সাবস্ক্রিপশন কেনার জন্য দয়া করে লগইন করুন।', 'info');
    myPurchasedChannelsCard.style.display = 'none'; // লগইন না থাকলে কেনা চ্যানেলের কার্ড লুকান
  }
});

// প্রাথমিক লোডিং স্ক্রিন দেখান
showLoadingScreen();
updateCost(); // প্রাথমিক খরচ সেট করুন
