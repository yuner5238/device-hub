import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import {
  getDatabase,
  ref,
  get,
  update,
  child
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyAiNEktrGgrjNfgpHVA6q1aBtDoZ6c5fMM",
  authDomain: "device-hub-5238.firebaseapp.com",
  databaseURL: "https://device-hub-5238-default-rtdb.firebaseio.com",
  projectId: "device-hub-5238",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

function getDeviceIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function showDeviceData(device) {
  document.getElementById("deviceName").textContent = device.name || "未知设备";
  document.getElementById("deviceLocation").textContent = device.location || "N/A";
  document.getElementById("deviceMaintenance").textContent = device.last_maintenance || "N/A";
  document.getElementById("deviceNotes").textContent = device.notes || "无";
  document.getElementById("editLocation").value = device.location || "";
  document.getElementById("editNotes").value = device.notes || "";
}

function toggleEditMode(editMode) {
  document.querySelectorAll(".edit-field").forEach(el => el.style.display = editMode ? "block" : "none");
  document.getElementById("btnEdit").style.display = editMode ? "none" : "inline-block";
  document.getElementById("btnSaveDeviceInfo").style.display = editMode ? "inline-block" : "none";
}

async function fetchDeviceData(deviceId) {
  const snapshot = await get(child(ref(db), `devices/${deviceId}`));
  return snapshot.exists() ? snapshot.val() : null;
}

async function saveDeviceData(deviceId, updates) {
  await update(ref(db, `devices/${deviceId}`), updates);
}

document.getElementById("btnLogin").onclick = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    await user.getIdTokenResult(true); // 强制刷新

    const isAdmin = user.getIdTokenResult().claims.admin === true;
    document.getElementById("loginStatus").textContent = `登录成功: ${email} admin 权限: ${isAdmin}`;

    if (!isAdmin) {
      alert("你没有管理员权限，无法保存。");
    }
  } catch (e) {
    alert("登录失败：" + e.message);
  }
};

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const tokenResult = await user.getIdTokenResult(true);
  const isAdmin = tokenResult.claims.admin === true;

  const deviceId = getDeviceIdFromUrl();
  const device = await fetchDeviceData(deviceId);
  if (device) showDeviceData(device);

  toggleEditMode(false);

  document.getElementById("btnEdit").onclick = () => {
    if (!isAdmin) return alert("无管理员权限");
    toggleEditMode(true);
  };

  document.getElementById("btnSaveDeviceInfo").onclick = async () => {
    const updates = {
      location: document.getElementById("editLocation").value.trim(),
      notes: document.getElementById("editNotes").value.trim()
    };

    try {
      await saveDeviceData(deviceId, updates);
      alert("更新成功！");
      toggleEditMode(false);
      const updated = await fetchDeviceData(deviceId);
      if (updated) showDeviceData(updated);
    } catch (e) {
      alert("保存失败：" + e.message);
    }
  };
});
