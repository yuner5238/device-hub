<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>设备详情</title>
  <link rel="stylesheet" href="https://unpkg.com/element-plus/dist/index.css" />
  <script src="https://unpkg.com/vue@3"></script>
  <script src="https://unpkg.com/element-plus"></script>
  <!-- Firebase 兼容版 -->
  <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>

  <style>
    #app { max-width: 700px; margin: 30px auto; }
    .info-row { margin-bottom: 20px; }
  </style>
</head>
<body>
<div id="app">
  <el-card shadow="hover" style="padding: 20px;">
    <el-page-header content="设备详情" @back="goHome" :show-back="true" style="margin-bottom: 20px;"></el-page-header>

    <div v-if="!loaded">
      <el-skeleton rows="5" animated />
    </div>

    <div v-else>
      <el-descriptions title="设备信息" :column="1" border>
        <el-descriptions-item label="设备名称">{{ device.name || '无名设备' }}</el-descriptions-item>
        <el-descriptions-item label="位置">
          <template v-if="editMode">
            <el-input v-model="editLocation" placeholder="请输入设备位置"></el-input>
          </template>
          <template v-else>{{ device.location || '未知' }}</template>
        </el-descriptions-item>
        <el-descriptions-item label="上次维护">{{ device.last_maintenance || '无' }}</el-descriptions-item>
        <el-descriptions-item label="备注">
          <template v-if="editMode">
            <el-input type="textarea" :rows="4" v-model="editNotes" placeholder="请输入备注"></el-input>
          </template>
          <template v-else>{{ device.notes || '无' }}</template>
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="!editMode" style="margin-top: 20px; text-align: right;">
        <el-button type="primary" @click="startEdit">编辑</el-button>
        <el-button @click="goHome">主页</el-button>
      </div>

      <div v-else style="margin-top: 20px;">
        <el-input
          v-model="editPassword"
          type="password"
          placeholder="请输入编辑密码"
          style="max-width: 300px; margin-bottom: 10px;"
          @keyup.enter="saveEdit"
        />
        <div style="text-align: right;">
          <el-button type="primary" @click="saveEdit">保存</el-button>
          <el-button @click="cancelEdit">取消</el-button>
        </div>
      </div>
    </div>
  </el-card>
</div>

<script>
  // Firebase 配置，替换成你自己的
  const firebaseConfig = {
    apiKey: "AIzaSyAiNEktrGgrjNfgpHVA6q1aBtDoZ6c5fMM",
    authDomain: "device-hub-5238.firebaseapp.com",
    databaseURL: "https://device-hub-5238-default-rtdb.firebaseio.com",
    projectId: "device-hub-5238",
    storageBucket: "device-hub-5238.firebasestorage.app",
    messagingSenderId: "648686550801",
    appId: "1:648686550801:web:2f460487e32914042316b0",
    measurementId: "G-44L5PHN36Y"
  };
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();

  const { createApp, ref, onMounted } = Vue;
  const { ElMessage } = ElementPlus;

  createApp({
    setup() {
      const device = ref({});
      const loaded = ref(false);
      const editMode = ref(false);
      const editLocation = ref('');
      const editNotes = ref('');
      const editPassword = ref('');

      // 读取 URL id
      function getDeviceIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
      }

      async function fetchDeviceData(id) {
        try {
          const snapshot = await database.ref('devices/' + id).once('value');
          if (snapshot.exists()) {
            device.value = snapshot.val();
          } else {
            ElMessage.error('未找到该设备');
          }
        } catch (e) {
          ElMessage.error('加载设备失败：' + e.message);
        } finally {
          loaded.value = true;
        }
      }

      function goHome() {
        window.location.href = 'index.html';
      }

      function startEdit() {
        editPassword.value = '';
        editLocation.value = device.value.location || '';
        editNotes.value = device.value.notes || '';
        editMode.value = true;
      }

      async function saveEdit() {
        if (editPassword.value !== 'bianji') {
          ElMessage.error('编辑密码错误');
          return;
        }
        try {
          const deviceId = getDeviceIdFromUrl();
          await database.ref('devices/' + deviceId).update({
            location: editLocation.value.trim(),
            notes: editNotes.value.trim()
          });
          ElMessage.success('设备信息已更新');
          device.value.location = editLocation.value.trim();
          device.value.notes = editNotes.value.trim();
          editMode.value = false;
          editPassword.value = '';
        } catch (e) {
          ElMessage.error('保存失败：' + e.message);
        }
      }

      function cancelEdit() {
        editMode.value = false;
        editPassword.value = '';
      }

      onMounted(() => {
        const id = getDeviceIdFromUrl();
        if (!id) {
          ElMessage.error('未传入设备ID');
          return;
        }
        fetchDeviceData(id);
      });

      return {
        device,
        loaded,
        editMode,
        editLocation,
        editNotes,
        editPassword,
        goHome,
        startEdit,
        saveEdit,
        cancelEdit
      };
    }
  }).use(ElementPlus).mount('#app');
</script>
</body>
</html>
