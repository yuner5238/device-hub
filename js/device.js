// 读取 URL 参数，比如 ?id=fridge_001
function getQueryParam(key) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(key);
}

async function loadDeviceDetail() {
  const deviceId = getQueryParam("id");
  const nameEl = document.getElementById("name");
  const infoEl = document.getElementById("info");

  if (!deviceId) {
    nameEl.innerText = "未指定设备 ID";
    infoEl.innerText = "请通过正确的链接访问，例如：?id=fridge_001";
    return;
  }

  try {
    // ✅ 修复路径：直接从当前目录加载 devices.json
    const res = await fetch("devices.json");
    const devices = await res.json();

    const device = devices.find(d => d.id === deviceId);

    if (!device) {
      nameEl.innerText = "设备未找到";
      infoEl.innerText = `ID 为 ${deviceId} 的设备不存在`;
      return;
    }

    nameEl.innerText = device.name;
    infoEl.innerHTML = `
      <p><strong>位置：</strong>${device.location}</p>
      <p><strong>上次维护：</strong>${device.last_maintenance}</p>
      <p><strong>备注：</strong>${device.notes}</p>
    `;
  } catch (err) {
    nameEl.innerText = "加载失败";
    infoEl.innerText = "无法加载设备数据，请稍后重试";
    console.error("加载设备失败：", err);
  }
}

loadDeviceDetail();
