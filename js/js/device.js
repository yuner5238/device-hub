function getQueryParam(key) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(key);
}

async function loadDeviceDetail() {
  const deviceId = getQueryParam("id");
  if (!deviceId) {
    document.getElementById("info").innerText = "未提供设备 ID";
    return;
  }

  try {
    const res = await fetch("../devices.json");
    const devices = await res.json();
    const device = devices.find(d => d.id === deviceId);

    if (!device) {
      document.getElementById("info").innerText = "未找到该设备";
      return;
    }

    document.getElementById("name").innerText = device.name;
    document.getElementById("info").innerHTML = `
      <p><strong>位置：</strong>${device.location}</p>
      <p><strong>上次维护：</strong>${device.last_maintenance}</p>
      <p><strong>备注：</strong>${device.notes}</p>
    `;
  } catch (err) {
    document.getElementById("info").innerText = "加载设备信息失败";
    console.error(err);
  }
}

loadDeviceDetail();
