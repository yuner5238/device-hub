// device.js (请用这份代码替换你当前的文件)

// --- Firebase 模块导入 ---
// 【重要提示】: 请确保这些导入语句是正确的。
// 如果你不是通过 npm/yarn 和打包工具使用，并且没有使用 CDN 模块加载器，
// 你可能会需要修改 HTML 中的 <script> 标签来直接从 Firebase CDN 导入。
// 但因为你HTML中已经有了 <script type="module" src="device.js"></script>
// 并且移除了 -compat.js，所以这种 import 方式是正确的。
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase, ref, set, update, get, child } from 'firebase/database';

// --- Firebase 配置信息 ---
// 【重要提示】: 这些信息是你的项目独有的。
// 我已经根据你提供的信息填充了，但请务必确认它们是最新的，并且在你的 Firebase 项目设置中是正确的。
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
// 只初始化一次。
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // 获取认证服务实例
const db = getDatabase(app); // 获取 Realtime Database 服务实例

// --- 常量与辅助函数 ---

// 【重要提示】: 这个密码保护方式非常不安全！
// 在生产环境中，不应该将密码硬编码在前端代码中。
// 考虑使用 Firebase Authentication + Firebase Security Rules 来实现更安全的访问控制。
const EDIT_PASSWORD = "123456";

/**
 * 从 URL 中获取设备 ID。
 */
function getDeviceIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

/**
 * 从 Firebase Realtime Database 获取单个设备数据 (使用模块化语法)。
 */
async function fetchDeviceData(deviceId) {
  try {
    const dbRef = ref(db); // 获取数据库根引用
    const snapshot = await get(child(dbRef, `devices/${deviceId}`)); // 读取指定路径下的数据

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

/**
 * 将设备数据显示到 HTML 页面上。
 * 【重要提示】: 确保这些 HTML 元素的 ID (`deviceName`, `deviceLocation`, etc.)
 * 与你的 HTML 文件中的实际 ID 匹配。
 */
function showDeviceData(device) {
  document.getElementById("deviceName").textContent = device.name || "未知设备";
  document.getElementById("deviceLocation").textContent = device.location || "N/A";
  document.getElementById("deviceMaintenance").textContent = device.last_maintenance || "N/A";
  document.getElementById("deviceNotes").textContent = device.notes || "无";

  document.getElementById("editLocation").value = device.location || "";
  document.getElementById("editNotes").value = device.notes || "";
}

/**
 * 切换编辑模式和显示模式。
 * 【重要提示】: 确保这些类名和 ID (`view-field`, `edit-field`, `btnEdit`, `btnSaveDeviceInfo`)
 * 与你的 HTML 结构相匹配。
 */
function toggleEditMode(editMode) {
  document.querySelectorAll(".view-field").forEach(el => el.style.display = editMode ? "none" : "block");
  document.querySelectorAll(".edit-field").forEach(el => el.style.display = editMode ? "block" : "none");
  document.getElementById("btnEdit").style.display = editMode ? "none" : "block";
  document.getElementById("btnSaveDeviceInfo").style.display = editMode ? "block" : "none";
}

/**
 * 将更新后的设备数据保存到 Firebase Realtime Database (使用模块化语法)。
 */
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
// 整个应用的核心逻辑都包裹在匿名登录成功的回调中，
// 确保在执行任何 Realtime Database 操作前，用户已通过身份验证。
signInAnonymously(auth)
  .then(async () => { // 匿名登录成功
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
    // 从 URL 获取设备 ID
    const deviceId = getDeviceIdFromUrl();
    if (!deviceId) {
      alert("设备ID缺失，无法加载。请确保URL中包含 '?id=your-device-id' 参数。");
      console.error("设备ID缺失，URL中应包含 '?id=your-device-id'。");
      return; // 终止函数执行
    }

    // 获取并显示设备数据
    const device = await fetchDeviceData(deviceId);
    if (!device) {
      alert("未找到对应设备信息或加载失败。请检查设备ID是否正确，以及 Firebase 数据库中是否存在该设备。");
      console.error("未能加载设备信息。");
      return; // 终止函数执行
    }

    showDeviceData(device); // 显示设备信息
    toggleEditMode(false); // 初始为显示模式

    // --- 事件监听器设置 ---
    // 【重要提示】: 确保你的 HTML 文件中存在 ID 为 "btnEdit" 和 "btnSaveDeviceInfo" 的按钮。
    const btnEdit = document.getElementById("btnEdit");
    if (btnEdit) {
      btnEdit.onclick = () => {
        toggleEditMode(true);
        document.getElementById("inputEditPassword").value = ""; // 清空密码输入框
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

        // 再次提醒：EDIT_PASSWORD 这种方式不安全，仅用于演示。
        // 在实际应用中，你应该使用更安全的认证和权限管理方式。
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
          toggleEditMode(false); // 切换回显示模式
          // 保存成功后，重新获取最新数据并显示
          const refreshedDevice = await fetchDeviceData(deviceId);
          if (refreshedDevice) showDeviceData(refreshedDevice);
        }
      };
    } else {
      console.error("HTML 元素 'btnSaveDeviceInfo' 未找到。请检查你的 HTML 文件。");
    }

  })
  .catch((error) => {
    // 匿名登录失败的处理
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("Firebase 匿名登录失败！设备管理功能将无法工作！", "错误代码:", errorCode, "错误信息:", errorMessage);
    alert(`应用初始化失败：无法连接到认证服务。错误: ${errorMessage}\n请检查网络连接或浏览器控制台了解更多信息。`);
  });

// 【重要提示】: 不需要 window.onload = ...。
// 整个脚本都是模块化的，并且逻辑已经由 Promise 链控制。
// 当使用 type="module" 时，脚本默认是 defer 的，会在 HTML 解析完成后执行。
