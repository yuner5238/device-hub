// device.js - 针对 GitHub Pages (无构建工具) 的最终版

// 【重要】: 请再次确认这些导入路径。它们必须是完整的 CDN URL。
// 请确保版本号 (例如 9.22.0) 与你在 Firebase 控制台看到的 Web SDK 版本一致。
// 你可以在 Firebase 控制台 -> 项目设置 -> 你的应用 -> SDK setup and configuration 中找到。
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getDatabase, ref, set, update, get, child } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

// --- Firebase 配置信息 ---
// 【重要】: 这些信息是你的项目独有的。
// 我已经根据你提供的信息填充了，但请务必确认它们是最新的。
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

// --- Firebase 应用和服务初始化 ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// --- 常量与辅助函数 ---

// 【重要】: 这个密码保护方式非常不安全！
// 任何查看你的源代码的人都能看到这个密码。
// 在生产环境中，强烈建议使用 Firebase Authentication 提供的用户身份验证功能
// 来控制用户对数据的写权限。
const EDIT_PASSWORD = "123456";

function getDeviceIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function fetchDeviceData(deviceId) {
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `devices/${deviceId}`));

    if (snapshot.exists()) {
      const deviceData = snapshot.val();
      console.log(`成功获取设备 "${deviceId}" 的数据:`, deviceData);
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

// 【重要】: 这些 HTML 元素的 ID 必须在你的 HTML 文件中存在。
function showDeviceData(device) {
  document.getElementById("deviceName").textContent = device.name || "未知设备";
  document.getElementById("deviceLocation").textContent = device.location || "N/A";
  document.getElementById("deviceMaintenance").textContent = device.last_maintenance || "N/A";
  document.getElementById("deviceNotes").textContent = device.notes || "无";

  document.getElementById("editLocation").value = device.location || "";
  document.getElementById("editNotes").value = device.notes || "";
}

// 【重要】: 这些类名和 ID (`view-field`, `edit-field`, `btnEdit`, `btnSaveDeviceInfo`)
// 必须与你的 HTML 结构相匹配。
function toggleEditMode(editMode) {
  document.querySelectorAll(".view-field").forEach(el => el.style.display = editMode ? "none" : "block");
  document.querySelectorAll(".edit-field").forEach(el => el.style.display = editMode ? "block" : "none");
  document.getElementById("btnEdit").style.display = editMode ? "none" : "block";
  document.getElementById("btnSaveDeviceInfo").style.display = editMode ? "block" : "none";
}

async function saveDeviceDataToFirebase(deviceId, updatedData) {
  try {
    await update(ref(db, `devices/${deviceId}`), updatedData);
    console.log(`设备 "${deviceId}" 信息已成功更新到 Firebase！`);
    alert("已成功更新设备信息！");
    return true;
  } catch (error) {
    console.error("保存设备信息到 Firebase 失败:", error);
    alert("保存失败：" + error.message);
    return false;
  }
}

// --- 主要应用逻辑入口 ---
signInAnonymously(auth)
  .then(async () => {
    const user = auth.currentUser;
    console.log("Firebase 匿名用户已登录！");
    console.log("用户 UID (唯一标识符):", user.uid);

    // 【可选】示例：向你的数据库写入一条测试消息
    const messageRef = ref(db, 'messages/welcome');
    set(messageRef, {
      text: "Hello from a securely authenticated (anonymous) user! This is a test message.",
      timestamp: new Date().toISOString(),
      senderUid: user.uid
    })
    .then(() => {
      console.log("测试消息写入 Realtime Database 成功！请检查你的 Firebase 控制台的 'messages/welcome' 路径。");
    })
    .catch((error) => {
      console.error("测试消息写入失败:", error.message);
    });

    // --- 设备管理应用的核心逻辑 ---
    const deviceId = getDeviceIdFromUrl();
    if (!deviceId) {
      alert("设备ID缺失，无法加载。请确保URL中包含 '?id=your-device-id' 参数。");
      console.error("设备ID缺失，URL中应包含 '?id=your-device-id'。");
      return;
    }

    const device = await fetchDeviceData(deviceId);
    if (!device) {
      alert("未找到对应设备信息或加载失败。请检查设备ID是否正确，以及 Firebase 数据库中是否存在该设备。");
      console.error("未能加载设备信息。");
      return;
    }

    showDeviceData(device);
    toggleEditMode(false);

    // 【重要】: 确保你的 HTML 文件中存在 ID 为 "btnEdit" 和 "btnSaveDeviceInfo" 的按钮。
    const btnEdit = document.getElementById("btnEdit");
    if (btnEdit) {
      btnEdit.onclick = () => {
        toggleEditMode(true);
        document.getElementById("inputEditPassword").value = "";
      };
    } else {
      console.error("HTML 元素 'btnEdit' 未找到。请检查你的 HTML 文件。");
    }

    const btnSaveDeviceInfo = document.getElementById("btnSaveDeviceInfo");
    if (btnSaveDeviceInfo) {
      btnSaveDeviceInfo.onclick = async () => {
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
    } else {
      console.error("HTML 元素 'btnSaveDeviceInfo' 未找到。请检查你的 HTML 文件。");
    }

  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("Firebase 匿名登录失败！设备管理功能将无法工作！", "错误代码:", errorCode, "错误信息:", errorMessage);
    alert(`应用初始化失败：无法连接到认证服务。错误: ${errorMessage}\n请检查网络连接或浏览器控制台了解更多信息。`);
  });
