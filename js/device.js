async function submitDeviceUpdateToGitHub(deviceId, updatedData) {
  const GITHUB_OWNER = "yuner5238";
  const GITHUB_REPO = "device-hub";
  const FILE_PATH = "devices.json";
  const BRANCH_PREFIX = "devicehub/update-";
  const TOKEN = "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"; // ✅ 用真实 PAT 或通过 GitHub Actions 方式安全传递

  if (!TOKEN || TOKEN.includes("xxxxx")) {
    alert("GitHub Token 未配置，无法提交数据。");
    return;
  }

  const apiBase = "https://api.github.com";
  const headers = {
    Authorization: `token ${TOKEN}`,
    Accept: "application/vnd.github+json",
  };

  // 1. 获取文件内容（包含 sha）
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

  // 2. 修改指定设备
  const deviceIndex = devices.findIndex((d) => d.id === deviceId);
  if (deviceIndex === -1) {
    alert("找不到设备 ID");
    return;
  }

  devices[deviceIndex] = { ...devices[deviceIndex], ...updatedData };

  // 3. 创建新分支
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

  // 4. 提交更新到新分支
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

  // 5. 创建 Pull Request
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
