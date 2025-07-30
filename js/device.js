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

  // Step 1: 获取最新 devices.json 的 SHA 和内容
  const fileRes = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DEVICES_JSON_PATH}?ref=${BASE_BRANCH}`,
    { headers }
  );
  const fileData = await fileRes.json();

  const contentDecoded = atob(fileData.content);
  let devices = JSON.parse(contentDecoded);

  // Step 2: 更新目标设备信息
  const deviceIndex = devices.findIndex((d) => d.id === updatedDevice.id);
  if (deviceIndex === -1) {
    alert("未找到设备，无法提交更新");
    return;
  }
  devices[deviceIndex] = updatedDevice;

  const updatedContent = JSON.stringify(devices, null, 2);
  const updatedEncoded = btoa(unescape(encodeURIComponent(updatedContent))); // 支持中文

  // Step 3: 创建新分支
  const timestamp = Date.now();
  const branchName = `devicehub/update-${updatedDevice.id}-${timestamp}`;

  const refRes = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${BASE_BRANCH}`,
    { headers }
  );
  const refData = await refRes.json();

  const createBranchRes = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: refData.object.sha
      })
    }
  );
  if (!createBranchRes.ok) {
    alert("创建分支失败");
    return;
  }

  // Step 4: 修改文件并提交 commit
  const updateFileRes = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DEVICES_JSON_PATH}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({
        mes
