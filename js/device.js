const deviceId = new URLSearchParams(location.search).get("id");

let currentDevice = null;

async function loadDeviceDetail() {
  const res = await fetch("devices.json");
  const devices = await res.json();
  const device = devices.find((d) => d.id === deviceId);

  if (!device) {
    document.body.innerHTML = "<p>未找到设备</p>";
    return;
  }

  currentDevice = device;

  document.getElementById("deviceName").textContent = device.name;
  document.getElementById("deviceLocation").textContent = device.location;
  document.getElementById("deviceMaintenance").textContent = device.last_maintenance;
  document.getElementById("deviceNotes").textContent = device.notes;

  document.getElementById("editLocation").value = device.location;
  document.getElementById("editNotes").value = device.notes;
}

// 切换到编辑模式
document.getElementById("btnEdit").addEventListener("click", () => {
  document.querySelectorAll(".edit-field").forEach(el => el.style.display = "block");
  document.querySelectorAll(".view-field").forEach(el => el.style.display = "none");
  document.getElementById("btnEdit").style.display = "none";
});

// 保存信息
document.getElementById("btnSaveDeviceInfo").addEventListener("click", () => {
  const password = document.getElementById("inputEditPassword").value;
  if (password !== "123456") {
    alert("密码错误！");
    return;
  }

  const updatedDevice = {
    ...currentDevice,
    location: document.getElementById("editLocation").value,
    notes: document.getElementById("editNotes").value,
  };

  submitDeviceUpdateToGitHub(updatedDevice);
});

// 提交到 GitHub PR
async function submitDeviceUpdateToGitHub(updatedDevice) {
  const GITHUB_TOKEN = "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";
  const REPO_OWNER = "yuner5238";
  const REPO_NAME = "device-hub";
  const DEVICES_JSON_PATH = "devices.json";
  const BASE_BRANCH = "main";

  const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json"
  };

  const fileRes = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DEVICES_JSON_PATH}?ref=${BASE_BRANCH}`,
    { headers }
  );
  const fileData = await fileRes.json();

  const contentDecoded = atob(fileData.content);
  let devices = JSON.parse(contentDecoded);

  const index = devices.findIndex((d) => d.id === updatedDevice.id);
  if (index === -1) {
    alert("设备未找到");
    return;
  }

  devices[index] = updatedDevice;

  const updatedContent = JSON.stringify(devices, null, 2);
  const updatedEncoded = btoa(unescape(encodeURIComponent(updatedContent)));

  const timestamp = Date.now();
  const newBranch = `devicehub/update-${updatedDevice.id}-${timestamp}`;

  const refRes = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${BASE_BRANCH}`,
    { headers }
  );
  const refData = await refRes.json();

  await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${newBranch}`,
        sha: refData.object.sha
      })
    }
  );

  await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DEVICES_JSON_PATH}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `Update device ${updatedDevice.id} info`,
        content: updatedEncoded,
        sha: fileData.sha,
        branch: newBranch
      })
    }
  );

  await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: `DeviceHub: Update device ${updatedDevice.id} information`,
        head: newBranch,
        base: BASE_BRANCH,
        body: `自动提交设备 ${updatedDevice.id} 信息更新请求。`
      })
    }
  );

  alert("修改已提交，将自动合并！");
}

loadDeviceDetail();
