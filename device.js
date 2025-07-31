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

初始化 Firebase 应用和服务
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // 获取认证服务实例
const db = getDatabase(app); // 获取 Realtime Database 服务实例

尝试匿名登录
signInAnonymously(auth)
  .then(() => {
    // 匿名登录成功！
    const user = auth.currentUser;
    console.log("匿名用户已登录！");
    console.log("用户UID (唯一标识符):", user.uid); // 你会看到一个临时的 UID

    // 现在，由于用户已经认证 (即使是匿名的)，
    // 你的 Realtime Database 写入操作就能通过 ".write": "auth != null" 规则了！

    // 示例：向你的数据库写入一些数据
    // 假设你想在 'messages' 路径下写入一条消息
    const messageRef = ref(db, 'messages/welcome'); // 创建一个指向 'messages/welcome' 的引用
    set(messageRef, {
      text: "Hello from a securely authenticated (anonymous) user!",
      timestamp: new Date().toISOString(),
      senderUid: user.uid // 可以将用户的UID保存下来，方便后续跟踪或更精细的权限控制
    })
    .then(() => {
      console.log("数据写入 Realtime Database 成功！请检查你的 Firebase 控制台。");
    })
    .catch((error) => {
      console.error("数据写入失败:", error.message);
    });

  })
  .catch((error) => {
    // 匿名登录失败
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("匿名登录失败！错误代码:", errorCode, "错误信息:", errorMessage);
    // 这里你可能需要显示一个错误信息给用户，或者采取其他恢复措施
  });

// 你还可以监听认证状态的变化，以便在用户登录/登出时更新 UI
// import { onAuthStateChanged } from 'firebase/auth';
// onAuthStateChanged(auth, (user) => {
//   if (user) {
//     console.log("认证状态改变：用户已登录", user.uid);
//   } else {
//     console.log("认证状态改变：用户已登出");
//   }
// });

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
