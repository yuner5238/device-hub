// Firebase 配置
const firebaseConfig = {
  apiKey: "你的API_KEY",
  authDomain: "device-hub-5238.firebaseapp.com",
  databaseURL: "https://device-hub-5238-default-rtdb.firebaseio.com",
  projectId: "device-hub-5238",
  storageBucket: "device-hub-5238.appspot.com",
  messagingSenderId: "你的SenderId",
  appId: "你的AppId"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const EDIT_PASSWORD = "123456"; // 编辑密码

function getDeviceIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

new Vue({
  el: '#app',
  data: {
    device: null,
    editMode: false,
    editForm: {
      location: '',
      notes: ''
    },
    editPassword: ''
  },
  methods: {
    async fetchDeviceData(id) {
      try {
        const snapshot = await database.ref('devices/' + id).once('value');
        if (snapshot.exists()) {
          const data = snapshot.val();
          this.device = { id, ...data };
        } else {
          this.$message.error("未找到设备ID: " + id);
        }
      } catch (err) {
        console.error("数据加载失败", err);
        this.$message.error("数据加载失败：" + err.message);
      }
    },
    startEdit() {
      this.editMode = true;
      this.editForm.location = this.device.location || '';
      this.editForm.notes = this.device.notes || '';
      this.editPassword = '';
    },
    cancelEdit() {
      this.editMode = false;
    },
    async saveEdit() {
      if (this.editPassword !== EDIT_PASSWORD) {
        this.$message.error("密码错误！");
        return;
      }

      try {
        await database.ref('devices/' + this.device.id).update({
          location: this.editForm.location,
          notes: this.editForm.notes
        });
        this.$message.success("保存成功！");
        this.editMode = false;
        this.fetchDeviceData(this.device.id); // 刷新数据
      } catch (err) {
        console.error("保存失败", err);
        this.$message.error("保存失败：" + err.message);
      }
    }
  },
  mounted() {
    const id = getDeviceIdFromUrl();
    if (!id) {
      this.$message.error("URL 中缺少 id 参数！");
      return;
    }
    this.fetchDeviceData(id);
  }
});
