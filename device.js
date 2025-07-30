// --- Firebase 配置与初始化 ---
// 这是你从 Firebase 控制台获取的配置信息，已为你替换
const firebaseConfig = {
  apiKey: "AIzaSyAiNEktrGgrjNfgpHVA6q1aBtDoZ6c5fMM",
  authDomain: "device-hub-5238.firebaseapp.com",
  databaseURL: "https://device-hub-5238-default-rtdb.firebaseio.com",
  projectId: "device-hub-5238",
  storageBucket: "device-hub-5238.firebasestorage.app",
  messagingSenderId: "648686550801",
  appId: "1:648686550801:web:2f460487e32914042316b0",
  measurementId: "G-44L5PHN36Y"
};

// Realtime Database 实例声明
let database; // 声明为全局变量，以便其他函数可以访问

// --- 常量与辅助函数 ---
const EDIT_PASSWORD = "123456"; // 简单密码保护，强烈建议未来使用 Firebase Authentication

function getDeviceIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

/**
 * 从 Firebase Realtime Database 获取单个设备数据
 * 假设数据结构是：/devices/<deviceId>
 */
async function fetchDeviceData(deviceId) {
  try {
    // 直接访问指定设备ID的路径
    const snapshot = await database.ref('devices/' + deviceId).once('value');
    if (snapshot.exists()) {
      const deviceData = snapshot.val();
      // 返回的数据中不包含id字段，但我们知道其id就是deviceId
      return { id: deviceId, ...deviceData };
    } else {
      console.warn(`未在 Firebase 中找到 ID 为 "${deviceId}" 的设备。`);
      return null;
    }
  } catch (error) {
    console.error("从 Firebase 获取设备数据失败:", error);
    alert("设备数据加载失败：" + error.message);
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

function toggleEditMode(editMode) {
  document.querySelectorAll(".view-field").forEach(el => el.style.display = editMode ? "none" : "block");
  document.querySelectorAll(".edit-field").forEach(el => el.style.display = editMode ? "block" : "none");
  document.getElementById("btnEdit").style.display = editMode ? "none" : "block";
  document.getElementById("btnSaveDeviceInfo").style.display = editMode ? "block" : "none";
}

/**
 * 将更新后的设备数据保存到 Firebase Realtime Database
 * 直接通过设备ID更新
 */
async function saveDeviceDataToFirebase(deviceId, updatedData) {
  try {
    await database.ref('devices/' + deviceId).update(updatedData);
    console.log("设备信息已成功更新到 Firebase！");
    alert("已成功更新设备信息！");
    return true;
  } catch (error) {
    console.error("保存设备信息到 Firebase 失败:", error);
    alert("保存失败：" + error.message);
    return false;
  }
}

// --- 初始化逻辑 ---
async function init() {
  // 确保在这些代码执行时，firebase 全局对象已经可用。
  firebase.initializeApp(firebaseConfig);
  database = firebase.database();

  const deviceId = getDeviceIdFromUrl();
  if (!deviceId) {
    alert("设备ID缺失，无法加载。请确保URL中包含 '?id=your-device-id' 参数。");
    return;
  }

  const device = await fetchDeviceData(deviceId);
  if (!device) {
    alert("未找到对应设备信息或加载失败。请检查设备ID是否正确，以及 Firebase 数据库中是否存在该设备。");
    return;
  }

  showDeviceData(device);
  toggleEditMode(false);

  document.getElementById("btnEdit").onclick = () => {
    toggleEditMode(true);
    document.getElementById("inputEditPassword").value = "";
  };

  document.getElementById("btnSaveDeviceInfo").onclick = async () => {
    const inputPwd = document.getElementById("inputEditPassword").value.trim();
    if (!inputPwd) {
      alert("请输入密码");
      return;
    }
    if (inputPwd !== EDIT_PASSWORD) {
      alert("密码错误，无法保存");
      return;
    }

    const updatedData = {
      location: document.getElementById("editLocation").value.trim(),
      notes: document.getElementById("editNotes").value.trim(),
    };

    const saveSuccess = await saveDeviceDataToFirebase(deviceId, updatedData);

    if (saveSuccess) {
      toggleEditMode(false);
      const refreshedDevice = await fetchDeviceData(deviceId);
      if (refreshedDevice) showDeviceData(refreshedDevice);
    }
  };
}

// 确保在整个页面加载完成后执行 init 函数
window.onload = init;
