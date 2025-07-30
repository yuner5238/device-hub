const EDIT_PASSWORD = "123456";

function getDeviceIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function fetchDeviceData(deviceId) {
  const res = await fetch("devices.json");
  if (!res.ok) {
    alert("设备数据加载失败");
    return null;
  }
  const devices = await res.json();
  return devices.find(d => d.id === deviceId) || null;
}

function showDeviceData(device) {
  document.getElementById("deviceName").textContent = device.name;
  document.getElementById("deviceLocation").textContent = device.location;
  document.getElementById("deviceMaintenance").textContent = device.last_maintenance;
  document.getElementById("deviceNotes").textContent = device.notes;

  document.getElementById("editLocation").value = device.location;
  document.getElementById("editNotes").value = device.notes;
}

function toggleEditMode(editMode) {
  document.querySelectorAll(".view-field").forEach(el => el.style.display = editMode ? "none" : "block");
  document.querySelectorAll(".edit-field").forEach(el => el.style.display = editMode ? "block" : "none");
}

async function submitDeviceUpdateToGitHub(deviceId, updatedData) {
  // 这里仅作模拟演示，不调用GitHub API，避免暴露TOKEN
  alert(`模拟提交设备 ${deviceId} 的更新:\n` + JSON.stringify(updatedData, null, 2));
  // 这里你可以调用自己的后端接口或者GitHub Actions接口完成真正提交
}

async function init() {
  const deviceId = getDeviceIdFromUrl();
  if (!deviceId) {
    alert("设备ID缺失，无法加载");
    return;
  }

  const device = await fetchDeviceData(deviceId);
  if (!device) {
    alert("未找到对应设备信息");
    return;
  }

  showDeviceData(device);
  toggleEditMode(false);

  document.getElementById("btnEdit").onclick = () => toggleEditMode(true);

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

    try {
      await submitDeviceUpdateToGitHub(deviceId, updatedData);
      toggleEditMode(false);
      // 保存成功后，刷新页面显示最新数据
      const refreshedDevice = await fetchDeviceData(deviceId);
      if (refreshedDevice) showDeviceData(refreshedDevice);
    } catch (err) {
      alert("保存失败：" + err.message);
    }
  };
}

window.onload = init;
