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
  const GITHUB_OWNER = "yuner5238";
  const GITHUB_REPO = "device-hub";
  const FILE_PATH = "devices.json";
  const BRANCH_PREFIX = "devicehub/update-";
  const TOKEN = "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"; // 请用安全方式管理

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

  const deviceIndex = devices.findIndex(d => d.id === deviceId);
  if (deviceIndex === -1) {
    alert("找不到设备 ID");
    return;
  }

  devices[deviceIndex] = { ...devices[deviceIndex], ...updatedData };

  const branchName = `${BRANCH_PREFIX}${deviceId}-${Date.now()}`;
  const refRes = await fetch(`${apiBase}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/main`, { headers });
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
