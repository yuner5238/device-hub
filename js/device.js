function getCurrentDeviceId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadDeviceInfo() {
  const deviceId = getCurrentDeviceId();
  if (!deviceId) {
    alert("设备ID缺失，无法加载");
    return;
  }

  const res = await fetch("devices.json");
  if (!res.ok) {
    alert("无法加载设备数据");
    return;
  }

  const devices = await res.json();
  const device = devices.find(d => d.id === deviceId);
  if (!device) {
    alert("未找到设备信息");
    return;
  }

  document.getElementById("deviceName").textContent = device.name;
  document.getElementById("deviceLocation").textContent = device.location;
  document.getElementById("deviceMaintenance").textContent = device.last_maintenance;
  document.getElementById("deviceNotes").textContent = device.notes;

  document.getElementById("editLocation").value = device.location;
  document.getElementById("editNotes").value = device.notes;
}

function toggleEditMode(editMode) {
  const viewFields = document.querySelectorAll(".view-field");
  const editFields = document.querySelectorAll(".edit-field");
  viewFields.forEach(el => el.style.display = editMode ? "none" : "block");
  editFields.forEach(el => el.style.display = editMode ? "block" : "none");
}

async function submitDeviceUpdateToGitHub(deviceId, updatedData) {
  // 这里写你的GitHub提交代码，或用之前的版本，简略版如下：
  alert("这里执行GitHub提交逻辑，示例中省略");
}

document.addEventListener("DOMContentLoaded", () => {
  loadDeviceInfo();

  const EDIT_PASSWORD = "123456"; // <-- 这里改成你想要的密码

  const btnEdit = document.getElementById("btnEdit");
  const btnSave = document.getElementById("btnSaveDeviceInfo");

  btnEdit.addEventListener("click", () => {
    toggleEditMode(true);
  });

  btnSave.addEventListener("click", async () => {
    const deviceId = getCurrentDeviceId();
    const newLocation = document.getElementById("editLocation").value.trim();
    const newNotes = document.getElementById("editNotes").value.trim();
    const password = document.getElementById("inputEditPassword").value.trim();

    if (!password) {
      alert("请输入密码");
      return;
    }

    if (password !== EDIT_PASSWORD) {
      alert("密码错误，无法保存");
      return;
    }

    const updatedData = {
      location: newLocation,
      notes: newNotes,
    };

    await submitDeviceUpdateToGitHub(deviceId, updatedData);

    toggleEditMode(false);
    loadDeviceInfo();
  });
});
