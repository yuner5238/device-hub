// 配置项（从 GitHub Secrets 获取，或硬编码测试）
const GITHUB_REPO = 'yuner5238/device-hub'; // 你的仓库名（格式：用户名/仓库名）
const DEVICES_FILE = 'devices.json'; // 设备数据文件名
const WEBHOOK_URL = 'https://api.github.com/repos/yuner5238/device-hub/dispatches'; // GitHub Webhook 地址

// 全局变量
let devices = []; // 存储设备数据
let currentEditId = null; // 当前编辑的设备 ID

// 页面加载时初始化
window.onload = async () => {
    await syncDevices(); // 首次加载同步数据
};

/**
 * 同步设备数据（从 GitHub 仓库拉取）
 */
async function syncDevices() {
    try {
        // 调用 GitHub API 获取 devices.json 内容（通过 GitHub Actions 触发）
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${DEVICES_FILE}`, {
            headers: { 'Authorization': `token ${await getGitHubToken()}` }
        });

        if (!response.ok) throw new Error('同步失败：' + response.statusText);
        
        // 解析 Base64 内容
        const data = await response.json();
        devices = JSON.parse(atob(data.content)); // 解码并解析 JSON
        
        // 渲染设备列表
        renderDevices();
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('deviceListSection').style.display = 'block';
    } catch (error) {
        showError('同步失败：' + error.message);
    }
}

/**
 * 渲染设备列表
 */
function renderDevices() {
    const container = document.getElementById('deviceList');
    container.innerHTML = devices.map(device => `
        <div class="device-card" data-id="${device.id}">
            <h3>${device.name}</h3>
            <p>位置：${device.location}</p>
            <p>最后维护：${device.last_maintenance}</p>
            <p>备注：${device.notes}</p>
            <button class="sync-btn" onclick="startEdit('${device.id}')">编辑</button>
        </div>
    `).join('');
}

/**
 * 开始编辑设备
 */
function startEdit(deviceId) {
    currentEditId = deviceId;
    const device = devices.find(d => d.id === deviceId);
    
    if (!device) {
        showError('设备数据丢失');
        return;
    }

    // 填充表单
    document.getElementById('edit-id').value = device.id;
    document.getElementById('edit-name').value = device.name;
    document.getElementById('edit-location').value = device.location;
    document.getElementById('edit-last-maintenance').value = device.last_maintenance;
    document.getElementById('edit-notes').value = device.notes;

    // 显示编辑表单
    document.getElementById('editForm').style.display = 'block';
}

/**
 * 保存设备修改（触发 GitHub Actions 工作流）
 */
async function saveDevice(event) {
    event.preventDefault();
    try {
        const updatedDevice = {
            id: document.getElementById('edit-id').value,
            name: document.getElementById('edit-name').value,
            location: document.getElementById('edit-location').value,
            last_maintenance: document.getElementById('edit-last-maintenance').value,
            notes: document.getElementById('edit-notes').value
        };

        // 调用 GitHub Actions 触发更新（通过 Webhook）
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Authorization': `token ${await getGitHubToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event_type: 'update_devices',
                client_payload: { devices: devices } // 传递最新设备数据
            })
        });

        if (!response.ok) throw new Error('保存失败：' + response.statusText);
        
        alert('设备信息已提交，等待同步...');
        cancelEdit();
    } catch (error) {
        showError('保存失败：' + error.message);
    }
}

/**
 * 取消编辑
 */
function cancelEdit() {
    document.getElementById('editForm').style.display = 'none';
    currentEditId = null;
}

/**
 * 显示错误提示
 */
function showError(message) {
    alert(message);
}

/**
 * 获取 GitHub Token（从 GitHub Secrets 或环境变量）
 */
async function getGitHubToken() {
    // 实际生产环境中，Token 应存储在 GitHub Secrets 中，通过后端服务获取
    // 此处为测试，直接返回硬编码的 Token（仅用于本地调试）
    return 'ghp_your_pat_here'; // 替换为你的 PAT
}
