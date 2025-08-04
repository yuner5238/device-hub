// device.js
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>

<script>
  // 初始化 Firebase（请替换为你的配置）
  const firebaseConfig = {
    apiKey: "你的 apiKey",
    authDomain: "你的 authDomain",
    databaseURL: "你的 databaseURL",
    projectId: "你的 projectId",
    storageBucket: "你的 storageBucket",
    messagingSenderId: "你的 messagingSenderId",
    appId: "你的 appId"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  // 从 URL 获取设备 ID，例如 ?id=printer_154903
  const urlParams = new URLSearchParams(window.location.search);
  const deviceId = urlParams.get("id");

  // 页面元素引用
  const deviceNameEl = document.getElementById("deviceName");
  const locationEl = document.getElementById("location");
  const maintenanceEl = document.getElementById("lastMaintenance");
  const notesEl = document.getElementById("notes");

  const editBtn = document.getElementById("editBtn");
  const saveBtn = document.getElementById("saveBtn");
  const passwordPrompt = "bianji"; // 编辑密码

  let isEditing = false;

  // 获取设备数据
  function fetchDeviceData(id) {
    const refPath = `devices/${id}`;
    firebase.database().ref(refPath).once("value")
      .then(snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          deviceNameEl.value = data.name || "";
          locationEl.value = data.location || "";
          maintenanceEl.value = data.last_maintenance || "";
          notesEl.value = data.notes || "";
        } else {
          console.error("未找到设备ID: " + id);
          alert("未找到该设备，请确认链接是否正确。");
        }
      })
      .catch(error => {
        console.error("读取失败: ", error);
        alert("读取失败，请检查网络或数据库配置。");
      });
  }

  // 启用编辑模式
  function enableEditing() {
    const inputPwd = prompt("请输入编辑密码：");
    if (inputPwd === passwordPrompt) {
      isEditing = true;
      [deviceNameEl, locationEl, maintenanceEl, notesEl].forEach(el => el.removeAttribute("disabled"));
      saveBtn.style.display = "inline-block";
      editBtn.style.display = "none";
    } else {
      alert("密码错误");
    }
  }

  // 保存设备数据
  function saveDeviceData() {
    const updatedData = {
      name: deviceNameEl.value,
      location: locationEl.value,
      last_maintenance: maintenanceEl.value,
      notes: notesEl.value
    };

    firebase.database().ref(`devices/${deviceId}`).set(updatedData)
      .then(() => {
        alert("保存成功！");
        isEditing = false;
        [deviceNameEl, locationEl, maintenanceEl, notesEl].forEach(el => el.setAttribute("disabled", true));
        saveBtn.style.display = "none";
        editBtn.style.display = "inline-block";
      })
      .catch(error => {
        console.error("保存失败：", error);
        alert("保存失败，请重试");
      });
  }

  // 初始化页面
  if (deviceId) {
    fetchDeviceData(deviceId);
  } else {
    alert("未指定设备 ID");
  }

  // 绑定按钮事件
  editBtn.addEventListener("click", enableEditing);
  saveBtn.addEventListener("click", saveDeviceData);
</script>
