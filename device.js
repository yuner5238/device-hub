// device.js

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import {
  getDatabase,
  ref,
  get,
  update,
  child,
  set
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

// === Firebase 配置 ===
const firebaseConfig = {
  apiKey: "AIzaSyAiNEktrGgrjNfgpHVA6q1aBtDoZ6c5fMM",
  authDomain: "device-hub-5238.firebaseapp.com",
  databaseURL: "https://device-hub-5238-default-rtdb.firebaseio.com",
  projectId: "device-hub-5238",
  storageBucket: "device-hub-5238.appspot.com",
  messagingSenderId: "648686550801",
  appId: "1:648686550801:web:2f460487e32914042316b0",
  measurementId: "G-44L5PHN36Y"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// === 登录邮箱账号 ===
const email = "171519019@qq.com";
const password = "123456";

signInWithEmailAndPassword(auth, email, password)
  .then(async (userCredential) => {
    const user = userCredential.user;
    const tokenResult = await user.getIdTokenResult();
    const isAdmin = tokenResult.claims.admin === true;

    console.log("登录成功:", user.email, "admin 权限:", isAdmin);

    if (!isAdmin) {
      alert("当前账号没有编辑权限");
      return;
    }

    // 加载设备逻辑
    const deviceId = getDeviceIdFromUrl();
    if (!deviceId) {
      alert("缺少设备ID");
      return;
    }

    const device = await fetchDeviceData(deviceId);
    if (!device) {
      alert("设备不存在或加载失败");
      return;
    }

    showDeviceData(device);
    toggleEditMode(false);
    setupEditButton(deviceId);

  })
  .catch((error) => {
    console.error("登录失败:", error.code, error.message);
    alert("登录失败：" + error.message);
  });

// === 工具函数 ===

function getDeviceIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function fetchDeviceData(deviceId) {
  try {
    const snapshot = await get(child(ref(db), `devices/${deviceId}`));
    if (snapshot.exists()) return { id: deviceId, ...snapshot.val() };
    else return null;
  } catch (e) {
    console.error("读取失败:", e.message);
    return null;
  }
}

function showDeviceData(device) {
  document.getElementById("deviceName").textContent = device.name || "未知设备";
  document.getElementById("deviceLocation").textContent = device.location || "N/A";
  document.getElementById("deviceMaintenance").textContent = device.last_maintenance || "N/A";
  document.getElementById("deviceNotes").textContent = device.notes || "无";

  document.getElementById("editLocation").value = device.location || "";
  document.getElementById("editNotes").value = device.notes || "";
}

function toggleEditMode(editing) {
  document.querySelectorAll(".view-field").forEach(el => el.style.display = editing ? "none" : "block");
  document.querySelectorAll(".edit-field").forEach(el => el.style.display = editing ? "block" : "none");
  document.getElementById("btnEdit").style.display = editing ? "none" : "block";
  document.getElementById("btnSaveDeviceInfo").style.display = editing ? "block" : "none";
}

function setupEditButton(deviceId) {
  document.getElementById("btnEdit").onclick = () => {
    toggleEditMode(true);
  };

  document.getElementById("btnSaveDeviceInfo").onclick = async () => {
    const updated = {
      location: document.getElementById("editLocation").value.trim(),
      notes: document.getElementById("editNotes").value.trim()
    };

    try {
      await update(ref(db, `devices/${deviceId}`), updated);
      alert("保存成功");
      toggleEditMode(false);
      const refreshed = await fetchDeviceData(deviceId);
      if (refreshed) showDeviceData(refreshed);
    } catch (e) {
      alert("保存失败: " + e.message);
    }
  };
}
