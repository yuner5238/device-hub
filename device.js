// --- Firebase 配置 (可以保持全局，因为它只是数据) ---
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

// --- Realtime Database 实例声明 (先声明，在 init() 中赋值) ---
let database; // 声明为全局变量，以便其他函数可以访问

// --- 常量与辅助函数 ---
const EDIT_PASSWORD = "123456"; // 简单密码保护，强烈建议未来使用 Firebase Authentication

function getDeviceIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

/**
 * 从 Firebase Realtime Database 获取单个设备数据
 * 假设你的设备数据结构是：
 * {
 *   "devices": {
 *     "device-id-1": { "name": "设备1", "location": "位置1", ... },
 *     "device-id-2": { "name": "设备2", "location": "位置2", ... }
 *   }
 * }
 */
async function fetchDeviceData(deviceId) {
  try {
    // 使用 .once('value') 获取一次性数据快照
    const snapshot = await database.ref('devices/' + deviceId).once('value');
    if (snapshot.exists()) {
      const deviceData = snapshot.val();
      // 为了兼容原来的 devices.json 结构（有 id 字段），这里手动添加 id
      return { id: deviceId, ...deviceData };
    } else {
      console.warn("未在 Firebase 中找到设备ID:", deviceId);
      return null;
    }
  } catch (error) {
    console.error("从 Firebase 获取设备数据失败:", error);
    alert("设备数据加载失败：" + error.message);
    return null;
  }
}

function showDeviceData(device) {
  // 注意：这里假设你的 Firebase 数据库中的设备对象有 name, location, last_maintenance, notes 字段
  // 如果字段名不同，请根据你的实际数据结构进行修改
  document.getElementById("deviceName").textContent = device.name || "未知设备";
  document.getElementById("deviceLocation").textContent = device.location || "N/A";
  document.getElementById("deviceMaintenance").textContent = device.last_maintenance || "N/A";
  document.getElementById("deviceNotes").textContent = device.notes || "无";

  // 填充编辑字段
  document.getElementById("editLocation").value = device.location || "";
  document.getElementById("editNotes").value = device.notes || "";
}

function toggleEditMode(editMode) {
  document.querySelectorAll(".view-field").forEach(el => el.style.display = editMode ? "none" : "block");
  document.querySelectorAll(".edit-field").forEach(el => el.style.display = editMode ? "block" : "none");
  document.getElementById("btnEdit").style.display = editMode ? "none" : "block"; // 编辑模式下隐藏编辑按钮
  document.getElementById("btnSaveDeviceInfo").style.display = editMode ? "block" : "none"; // 编辑模式下显示保存按钮
}

/**
 * 将更新后的设备数据保存到 Firebase Realtime Database
 */
async function saveDeviceDataToFirebase(deviceId, updatedData) {
  try {
    // 使用 update 方法只更新指定字段，不会覆盖整个设备对象
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
  // !!! 关键改动：在这里初始化 Firebase 应用和获取数据库实例 !!!
  // 这确保了在这些代码执行时，firebase 全局对象已经可用。
  firebase.initializeApp(firebaseConfig);
  database = firebase.database(); // 将实例赋值给全局变量 database

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
  toggleEditMode(false); // 初始显示为查看模式

  document.getElementById("btnEdit").onclick = () => {
    toggleEditMode(true);
    document.getElementById("inputEditPassword").value = ""; // 进入编辑模式时清空密码
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
      // 如果你还需要更新其他字段，在这里添加
      // 例如：name: document.getElementById("deviceName").value.trim(),
      // 'last_maintenance' 字段通常由后端或特殊操作更新，而不是直接从前端编辑
    };

    // 保存到 Firebase
    const saveSuccess = await saveDeviceDataToFirebase(deviceId, updatedData);

    if (saveSuccess) {
      toggleEditMode(false);
      // 保存成功后，从 Firebase 重新获取最新数据并显示
      const refreshedDevice = await fetchDeviceData(deviceId);
      if (refreshedDevice) showDeviceData(refreshedDevice);
    }
  };
}

// 确保在整个页面加载完成后执行 init 函数
window.onload = init;
