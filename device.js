// --- Firebase 配置与初始化 ---
// !!! 请务必替换为你在 Firebase 控制台中找到的实际配置信息 !!!
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

// 初始化 Firebase 应用
firebase.initializeApp(firebaseConfig);

// 获取 Realtime Database 实例
const database = firebase.database();

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
 *     "device-id-1": { ...设备1数据... },
 *     "device-id-2": { ...设备2数据... }
 *   }
 * }
 */
async function fetchDeviceData(deviceId) {
  try {
    const snapshot = await database.ref('devices/' + deviceId).once('value');
    if (snapshot.exists()) {
      const deviceData = snapshot.val();
      // 为了兼容原来的 devices.json 结构（有 id 字段），这里手动添加 id
      return { id: deviceId, ...deviceData };
    } else {
      console.warn("未找到设备ID:", deviceId);
      return null;
    }
  } catch (error) {
    console.error("从 Firebase 获取设备数据失败:", error);
    alert("设备数据加载失败：" + error.message);
    return null;
  }
}

function showDeviceData(device) {
  document.getElementById("deviceName").textContent = device.name || "未知设备"; // 假设设备数据中有name字段
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
  const deviceId = getDeviceIdFromUrl();
  if (!deviceId) {
    alert("设备ID缺失，无法加载。请确保URL中包含 '?id=your-device-id' 参数。");
    return;
  }

  const device = await fetchDeviceData(deviceId);
  if (!device) {
    alert("未找到对应设备信息或加载失败。");
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
      // 你可以添加更多需要更新的字段
      // 例如：name: document.getElementById("deviceName").value.trim(),
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

window.onload = init;
