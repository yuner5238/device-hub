// 从 URL 读取参数 id
function getCurrentDeviceId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id"); // 改成 "id" 参数
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

  // 编辑框默认值
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
  // 你之前写的提交代码，这里保持不变即可
  const GITHUB_OWNER = "yuner5238";
  const GITHUB_REPO = "device-hub";
  const FILE_PATH = "devices.json";
  const BRANCH_PREFIX = "devicehub/update-";
  const TOKEN = ""; // ⚠️ 这里不直接写token，安全起见用 GitHub Actions

  if (!TOKEN || TOKEN.includes("xxxxx")) {
    alert("GitHub Token 未配置，无法提交数据。");
    return;
  }

  const apiBase = "https://api.github.com";
  const headers = {
    Authorization: `token ${TOKEN}`,
    Accept: "application/vnd.github+json",
  };

  const fileRes = await fetch(`${apiBase}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}?ref=main`, {
    headers,
  });

  if (!fileRes.ok) {
    alert("无法读取设备数据文件");
    return;
  }

  const fileData = await fileRes.json();
  const content = atob(fileData.content);
  const devices = JSON.parse(content);

  const deviceIndex = devices.findIndex((d) => d.id === deviceId);
  if (deviceIndex === -1) {
    alert("找不到设备 ID");
    return;
  }

  devices[deviceIndex] = { ...devices[deviceIndex], ...updatedData };

  const branchName = `${BRANCH_PREFIX}${deviceId}-${Date.now()}`;
  const refRes = await fetch(`${apiBase}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/main`, {
    headers,
  });

  const refData = await refRes.json();
  const baseSha = refData.object.sha;

  await fetch(`${apiBase}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    }),
  });

  const newContent = btoa(JSON.stringify(devices, null, 2));
  await fetch(`${apiBase}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `Update device ${deviceId}`,
      content: newContent,
      branch: branchName,
      sha: fileData.sha,
    }),
  });

  await fetch(`${apiBase}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: `Update ${deviceId}`,
      head: branchName,
      base: "main",
      body: `自动更新设备 ${deviceId} 的信息`,
    }),
  });

  alert("已提交更新请求，等待 GitHub 自动合并...");
}

document.addEventListener("DOMContentLoaded", () => {
  loadDeviceInfo();

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

    // 简单密码校验示例（你可以换成更安全的逻辑）
    if (password !== "your_password_here") {
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
