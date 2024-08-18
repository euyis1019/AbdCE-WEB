<template>
  <div class="report-form">
    <h1>{{ isEditMode ? '修改申报' : '综合评价信息申报' }}</h1>
    <el-card class="form-card" shadow="hover" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>申报进度</span>
          <el-button type="primary" @click="saveDraft" :disabled="submitting">保存草稿</el-button>
        </div>
      </template>

      <div class="progress-bar">
        <div
          v-for="(category, index) in categories"
          :key="category.code"
          class="progress-step"
          :class="{ 'active': index === activeCategory, 'completed': index < activeCategory }"
          @click="setActiveCategory(index)"
        >
          <CategoryInfo :categoryCode="category.code" />
        </div>
      </div>

      <div class="category-content" v-if="categories.length > 0">
        <h2>
          <CategoryInfo :categoryCode="categories[activeCategory].code" />
        </h2>
        <el-button type="primary" @click="showAddMaterialDialog" :disabled="submitting">添加材料</el-button>

        <el-table :data="currentCategoryMaterials" style="width: 100%; margin-top: 20px;">
          <el-table-column label="子类别" width="180">
            <template #default="scope">
              <CategoryInfo :categoryCode="scope.row.subCategory" />
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述"></el-table-column>
          <el-table-column prop="score" label="分数" width="100"></el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" type="primary" @click="editMaterial(scope.row, scope.$index)">编辑</el-button>
              <el-button size="small" type="danger" @click="removeMaterial(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="form-actions">
        <el-button v-if="activeCategory > 0" @click="prevCategory">上一步</el-button>
        <el-button v-if="activeCategory < categories.length - 1" type="primary" @click="nextCategory">下一步</el-button>
        <el-button v-if="activeCategory === categories.length - 1" type="success" @click="submitForm" :loading="submitting">{{ isEditMode ? '更新申报' : '提交申报' }}</el-button>
      </div>
    </el-card>

    <el-dialog v-model="materialDialogVisible" :title="isEditingMaterial ? '编辑材料' : '添加材料'" width="50%">
      <el-form :model="newMaterial" :rules="materialRules" ref="materialFormRef" label-width="100px">
        <el-form-item label="子类别" prop="subCategory">
          <el-select v-model="newMaterial.subCategory" placeholder="请选择子类别">
            <el-option
              v-for="subCategory in currentSubCategories"
              :key="subCategory.code"
              :label="subCategory.title"
              :value="subCategory.code"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="newMaterial.description" type="textarea" :rows="3"></el-input>
        </el-form-item>
        <el-form-item label="上传文件" prop="file">
          <el-upload
            class="upload-demo"
            :action="uploadUrl"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            :on-progress="handleUploadProgress"
            :headers="uploadHeaders"
          >
            <el-button size="small" type="primary">点击上传</el-button>
          </el-upload>
          <el-progress v-if="uploadProgress > 0 && uploadProgress < 100" 
                       :percentage="uploadProgress"></el-progress>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="materialDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="isEditingMaterial ? updateMaterial() : addMaterial()">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from '../../http-common'
import authService from '../../services/authService'
import CategoryInfo from '../../components/CategoryInfo.vue'

const route = useRoute()
const router = useRouter()

interface Category {
  code: string;
  title: string;
  subCategories: SubCategory[];
}

interface SubCategory {
  code: string;
  title: string;
  score: number;
}

interface Material {
  subCategory: string;
  description: string;
  score: number;
  file: {
    name: string;
    url: string;
  };
}

const categories = ref<Category[]>([]);
const activeCategory = ref(0);
const materialDialogVisible = ref(false);
const uploadProgress = ref(0);
const loading = ref(true);
const submitting = ref(false);

const materials = reactive<{ [key: string]: Material[] }>({});

const newMaterial = reactive<Material>({
  subCategory: '',
  description: '',
  score: 0,
  file: {
    name: '',
    url: ''
  }
});

const materialRules = {
  subCategory: [{ required: true, message: '请选择子类别', trigger: 'change' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  file: [{ required: true, message: '请上传文件', trigger: 'change' }]
};
// TODO: 后端 API 还没写
const uploadUrl = '/case/upload';

const uploadHeaders = computed(() => {
  const user = authService.getCurrentUser();
  return { 
    Authorization: `Bearer ${user?.access}` 
  };
});

const currentCategoryMaterials = computed(() => {
  const currentCategoryCode = categories.value[activeCategory.value]?.code;
  return materials[currentCategoryCode] || [];
});

const currentSubCategories = computed(() => {
  return categories.value[activeCategory.value]?.subCategories || [];
});

const isEditMode = computed(() => route.params.mode === 'edit');
const isEditingMaterial = ref(false);
const editingMaterialIndex = ref(-1);

onMounted(async () => {
  await fetchCategories();
  if (isEditMode.value) {
    await loadExistingData();
  } else {
    loadDraft();
  }
});

const fetchCategories = async () => {
  loading.value = true;
  try {
    const response = await axios.post('/case/findcase');
    if (response.data.statusID === 0) {
      categories.value = processCategories(response.data.data);
    } else {
      throw new Error(response.data.msg);
    }
  } catch (error) {
    console.error('获取类别数据失败:', error);
    ElMessage.error('获取类别数据失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

const processCategories = (data: any[]): Category[] => {
  return data.map(category => ({
    code: category.caseID,
    title: category.mainCLs,
    subCategories: [
      {
        code: category.cls1,
        title: category.cls2,
        score: category.point
      }
    ]
  }));
};

const loadExistingData = async () => {
  try {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('用户未登录');

    const response = await axios.post('/case/findcase', {
      FileID: route.params.fileID
    });

    if (response.data.statusID === 0) {
      const existingData = response.data.data;
      // 处理并填充现有数据到 materials 对象
      existingData.forEach((item: any) => {
        if (!materials[item.caseID]) {
          materials[item.caseID] = [];
        }
        materials[item.caseID].push({
          subCategory: item.cls1,
          description: item.description,
          score: item.point,
          file: {
            name: item.file,
            url: item.file
          }
        });
      });
    } else {
      throw new Error(response.data.msg);
    }
  } catch (error) {
    console.error('加载现有数据失败:', error);
    ElMessage.error('加载现有数据失败，请稍后重试');
  }
};

const setActiveCategory = (index: number) => {
  activeCategory.value = index;
};

const showAddMaterialDialog = () => {
  materialDialogVisible.value = true;
  isEditingMaterial.value = false;
  newMaterial.subCategory = '';
  newMaterial.description = '';
  newMaterial.score = 0;
  newMaterial.file = { name: '', url: '' };
  uploadProgress.value = 0;
};

const handleUploadSuccess = (res: any, file: any) => {
  newMaterial.file = { name: file.name, url: res.url };
  uploadProgress.value = 100;
  ElMessage.success('上传成功');
};

const handleUploadError = () => {
  ElMessage.error('上传失败，请重试');
};

const handleUploadProgress = (event: any, file: any) => {
  uploadProgress.value = Math.round(event.percent);
};

const beforeUpload = (file: any) => {
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    ElMessage.error('上传文件大小不能超过 10MB!');
  }
  return isLt10M;
};

const addMaterial = async () => {
  const materialFormRef = ref<any>(null);
  if (!materialFormRef.value) return;

  try {
    await materialFormRef.value.validate();
    const currentCategoryCode = categories.value[activeCategory.value].code;
    if (!materials[currentCategoryCode]) {
      materials[currentCategoryCode] = [];
    }
    const selectedSubCategory = currentSubCategories.value.find(sc => sc.code === newMaterial.subCategory);
    materials[currentCategoryCode].push({
      ...newMaterial,
      score: selectedSubCategory ? selectedSubCategory.score : 0
    });
    materialDialogVisible.value = false;
    ElMessage.success('材料添加成功');
  } catch (error) {
    console.error('添加材料失败:', error);
    ElMessage.error('添加材料失败，请检查输入');
  }
};

const editMaterial = (material: Material, index: number) => {
  isEditingMaterial.value = true;
  editingMaterialIndex.value = index;
  Object.assign(newMaterial, material);
  materialDialogVisible.value = true;
};

const updateMaterial = async () => {
  const materialFormRef = ref<any>(null);
  if (!materialFormRef.value) return;

  try {
    await materialFormRef.value.validate();
    const currentCategoryCode = categories.value[activeCategory.value].code;
    const selectedSubCategory = currentSubCategories.value.find(sc => sc.code === newMaterial.subCategory);
    materials[currentCategoryCode][editingMaterialIndex.value] = {
      ...newMaterial,
      score: selectedSubCategory ? selectedSubCategory.score : 0
    };
    materialDialogVisible.value = false;
    ElMessage.success('材料更新成功');
  } catch (error) {
    console.error('更新材料失败:', error);
    ElMessage.error('更新材料失败，请检查输入');
  }
};

const removeMaterial = (index: number) => {
  const currentCategoryCode = categories.value[activeCategory.value].code;
  materials[currentCategoryCode].splice(index, 1);
};

const prevCategory = () => {
  if (activeCategory.value > 0) {
    activeCategory.value--;
  }
};

const nextCategory = () => {
  if (activeCategory.value < categories.value.length - 1) {
    activeCategory.value++;
  }
};

const submitForm = async () => {
  submitting.value = true;
  try {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    // 创建一个数组来存储所有的提交请求
    const submitPromises = Object.entries(materials).flatMap(([categoryCode, categoryMaterials]) =>
      categoryMaterials.map(material => {
        const payload = {
          userID: user.ID,
          caseID: categoryCode,
          mainCLs: categories.value.find(c => c.code === categoryCode)?.title,
          cls1: material.subCategory,
          cls2: '',
          cls3: '',
          cls4: '',
          point: material.score.toString(),
          judgment: material.description,
          file: material.file.url
        };
        
        if (isEditMode.value) {
          return axios.post('/case/updatenewcase', {
            ...payload,
            FileID: route.params.fileID
          });
        } else {
          return axios.post('/case/newcase', payload);
        }
      })
    );

    // 等待所有请求完成
    const responses = await Promise.all(submitPromises);

    // 检查所有响应是否都成功
    if (responses.every(response => response.data.statusID === 1)) {
      ElMessage.success(isEditMode.value ? '申报更新成功' : '申报提交成功');
      localStorage.removeItem('reportDraft');
      router.push('/state');
    } else {
      throw new Error('部分申报提交失败');
    }
  } catch (error) {
    console.error('提交失败:', error);
    ElMessage.error('提交失败，请重试');
  } finally {
    submitting.value = false;
  }
};

const saveDraft = () => {
  localStorage.setItem('reportDraft', JSON.stringify(materials));
  ElMessage.success('草稿已保存');
};

const loadDraft = () => {
  const draft = localStorage.getItem('reportDraft');
  if (draft) {
    ElMessageBox.confirm('发现未提交的草稿，是否加载？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      Object.assign(materials, JSON.parse(draft));
      ElMessage.success('草稿已加载');
    }).catch(() => {
      ElMessage.info('已取消加载草稿');
    });
  }
};

// 监听路由变化，当从编辑模式切换到新建模式时，清空表单
watch(() => route.params.mode, (newMode) => {
  if (newMode !== 'edit') {
    Object.keys(materials).forEach(key => materials[key] = []);
    loadDraft();
  }
});
</script>

<style scoped>
.report-form {
  padding: 20px;
}

.form-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.progress-step {
  flex: 1;
  text-align: center;
  padding: 10px;
  background-color: #f0f0f0;
  border: 1px solid #dcdfe6;
  cursor: pointer;
}

.progress-step.active {
  background-color: #409EFF;
  color: white;
}

.progress-step.completed {
  background-color: #67C23A;
  color: white;
}

.category-content {
  margin-top: 20px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .report-form {
    padding: 10px;
  }
  
  .progress-bar {
    flex-direction: column;
  }

  .progress-step {
    margin-bottom: 10px;
  }

  .el-button {
    margin-bottom: 10px;
    width: 100%;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>