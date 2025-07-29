// 配置项
const GITHUB_REPO = 'yuner5238/device-hub'; // 你的仓库名（格式：用户名/仓库名）
const DEVICES_FILE = 'devices.json'; // 设备数据文件名
const GITHUB_TOKEN = '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'; // 替换为你的 PAT（仅测试用，生产环境用 Secrets）

// 全局变量
let devices = []; // 存储设备数据
let currentEditId = null; // 当前编辑的设备 ID

// 页面加载时初始化
window.onload = async () => {
    await loadDevices(); // 首次加载设备数据
};

/**
 * 从 GitHub 仓库加载 devices.json 数据
 */
async function loadDevices() {
    try {
        document.getElementById('loadingSection').style.display = 'block';
        document.getElementById('errorSection').style.display = 'none';

        // 调用 GitHub API 获取 devices.json 内容
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/${DEVICES_FILE}`,
            { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } }
        );

        if (!response.ok) throw new Error('加载失败：' + response.statusText);
        
        // 解析 Base64 内容
        const data = await response.json();
        devices = JSON.parse(atob(data.content)); // 解码并解析 JSON
        
        // 渲染设备列表
        renderDevices();
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('deviceListSection').style.display = 'block';
    } catch (error) {
        document.getElementById('errorSection').textContent = '加载失败：' + error.message;
        document.getElementById('errorSection').style.display = 'block';
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
 * 保存设备修改（触发 GitHub 推送）
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

        // 更新本地设备数据
        const index = devices.findIndex(d => d.id === updatedDevice.id);
        devices[index] = updatedDevice;

        // 将更新后的数据写入 GitHub 仓库（触发 Pushes 事件）
        await pushDevicesToGitHub();

        // 刷新页面数据
        await loadDevices();
        cancelEdit();
    } catch (error) {
        showError('保存失败：' + error.message);
    }
}

/**
 * 将设备数据推送到 GitHub 仓库（触发 Pushes 事件）
 */
async function pushDevicesToGitHub() {
    try {
        // 获取原文件的 SHA 值（首次推送无需 SHA）
        let sha = '';
        try {
            const response = await fetch(
                `https://api.github.com/repos/${GITHUB_REPO}/contents/${DEVICES_FILE}`,
                { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } }
            );
            const data = await response.json();
            sha = data.sha;
        } catch (error) {
            // 首次推送，无 SHA，忽略错误
        }

        // 将设备数据编码为 Base64
        const content = Buffer.from(JSON.stringify(devices, null, 2)).toString('base64');

        // 调用 GitHub API 推送文件
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/${DEVICES_FILE}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: '前端更新设备数据',
                    content: content,
                    sha: sha // 首次推送无需 SHA
                })
            }
        );

        if (!response.ok) throw new Error('推送失败：' + response.statusText);
        return true;
    } catch (error) {
        throw new Error('推送失败：' + error.message);
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
 * 手动触发同步（测试用）
 */
async function triggerManualSync() {
    await loadDevices(); // 重新加载数据（模拟同步）
    alert('数据已手动同步！');
}

/**
 * 显示错误提示
 */
function showError(message) {
    document.getElementById('errorSection').textContent = message;
    document.getElementById('errorSection').style.display = 'block';
}
