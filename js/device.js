// 模拟当前设备ID获取函数（根据实际情况修改）
function getCurrentDeviceId() {
  // 假设从 URL 参数获取 deviceId，例如 device.html?device=fridge_001
  const params = new URLSearchParams(window.location.search);
  return params.get("device") || null;
}

// 页面初始化 - 显示设备信息（演示，实际你可能从 JSON 加载）
async function loadDeviceInfo() {
  const deviceId = getCurrentDeviceId();
  if (!deviceId) {
    alert("设备ID缺失，无法加载");
    return;
  }

  const res = await fetch("devices.json");
  const devices = await res.json();
  const device = devices.find(d => d.id === deviceId);
  if (!device) {
    alert("找不到该设备信息");
    return;
  }

  document.getElementById("deviceName").textContent = device.name;
  document.getElementById("deviceLocation").textContent = device.location;
  document.getElementById("deviceMaintenance").textContent = device.last_maintenance;
  document.getElementById("deviceNotes").textContent = device.notes;

  document.getElementById("editLocation").value = device.location;
  document.getElementById("editNotes").value = device.notes;
}

// 显示/隐藏编辑状态
function toggleEditMode(isEdit) {
  document.querySelectorAll(".edit-field").forEach(el => {
    el.style.display = isEdit ? "block" : "none";
  });
  document.querySelectorAll(".view-field").forEach(el => {
    el.style.display = isEdit ? "none" : "block";
  });
  document.getElementById("btnEdit").style.display = isEdit ? "none" : "inline-block";
  document.getElementById("btnSaveDeviceInfo").style.display = isEdit ? "inline-block" : "none";
  document.getElementById("issueInfo").style.display = "none";
}

function generateIssueContent(deviceId, updatedData) {
  const title = `Update Device ${deviceId}`;
  const body = JSON.stringify(updatedData, null, 2);
  return { title, body };
}

// 点击保存，生成 Issue 内容展示给用户复制
function onSaveDeviceInfo() {
  const deviceId = getCurrentDeviceId();
  if (!deviceId) {
    alert("设备ID缺失");
    return;
  }

  const location = document.getElementById("editLocation").value.trim();
  const notes = document.getElementById("editNotes").value.trim();

  const updatedData = {};
  if(location) updatedData.location = location;
  if(notes) updatedData.notes = notes;

  if (Object.keys(updatedData).length === 0) {
    alert("没有修改内容");
    return;
  }

  const { title, body } = generateIssueContent(deviceId, updatedData);
  const issueText = `请复制以下内容，去 GitHub 仓库新建一个 Issue 来提交修改：\n\n标题：${title}\n\n内容：\n${body}`;

  const issueInfo = document.getElementById("issueInfo");
  issueInfo.textContent = issueText;
  issueInfo.style.display = "block";

  toggleEditMode(false);
}

document.getElementById("btnEdit").addEventListener("click", () => {
  toggleEditMode(true);
});

document.getElementById("btnSaveDeviceInfo").addEventListener("click", () => {
  onSaveDeviceInfo();
});

window.onload = loadDeviceInfo;
