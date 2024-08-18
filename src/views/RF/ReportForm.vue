<template>
  <div class="report-form">
    <h1>综合评价信息申报</h1>
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
          <CategoryInfo :categoryCode="category.code">
            <template #default="{ categoryData }">
              {{ categoryData ? categoryData.title : category.code }}
            </template>
          </CategoryInfo>
        </div>
      </div>

      <div class="category-content" v-if="categories.length > 0">
        <h2>
          <CategoryInfo :categoryCode="categories[activeCategory].code">
            <template #default="{ categoryData }">
              {{ categoryData ? categoryData.title : categories[activeCategory].code }}
            </template>
          </CategoryInfo>
        </h2>
        <el-button type="primary" @click="showAddMaterialDialog" :disabled="submitting">添加材料</el-button>

        <el-table :data="currentCategoryMaterials" style="width: 100%; margin-top: 20px;">
          <el-table-column label="子类别" width="180">
            <template #default="scope">
              <CategoryInfo :categoryCode="scope.row.subCategory">
                <template #default="{ categoryData }">
                  {{ categoryData ? categoryData.title : scope.row.subCategory }}
                </template>
              </CategoryInfo>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述"></el-table-column>
          <el-table-column prop="score" label="分数" width="100"></el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button size="small" type="danger" @click="removeMaterial(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="form-actions">
        <el-button v-if="activeCategory > 0" @click="prevCategory">上一步</el-button>
        <el-button v-if="activeCategory < categories.length - 1" type="primary" @click="nextCategory">下一步</el-button>
        <el-button v-if="activeCategory === categories.length - 1" type="success" @click="submitForm" :loading="submitting">提交申报</el-button>
      </div>
    </el-card>

    <el-dialog v-model="materialDialogVisible" title="添加材料" width="50%">
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
          <el-button type="primary" @click="addMaterial">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from '../../http-common'
import authService from '../../services/authService'
import CategoryInfo from '../../components/CategoryInfo.vue'

// 类别接口定义
interface Category {
  code: string;
  name: string;
  subCategories: SubCategory[];
}

// 子类别接口定义
interface SubCategory {
  code: string;
  name: string;
  score: number;
}

// 材料接口定义
interface Material {
  subCategory: string;
  description: string;
  score: number;
  file: {
    name: string;
    url: string;
  };
}

// 类别数据
const categories = ref<Category[]>([]);
// 当前激活的类别索引
const activeCategory = ref(0);
// 添加材料对话框可见性
const materialDialogVisible = ref(false);
// 上传进度
const uploadProgress = ref(0);
// 加载状态
const loading = ref(true);
// 提交状态
const submitting = ref(false);

// 材料数据
const materials = reactive<{ [key: string]: Material[] }>({});

// 新建材料数据
const newMaterial = reactive<Material>({
  subCategory: '',
  description: '',
  score: 0,
  file: {
    name: '',
    url: ''
  }
});

// 添加材料表单验证规则
const materialRules = {
  subCategory: [{ required: true, message: '请选择子类别', trigger: 'change' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }],
  file: [{ required: true, message: '请上传文件', trigger: 'change' }]
};

// 上传文件 URL
const uploadUrl = '/report/upload';

// 上传文件请求头
const uploadHeaders = computed(() => {
  const user = authService.getCurrentUser();
  // 从 authService 获取 token 并设置到请求头
  return { 
    Authorization: `Bearer ${user?.access}` 
  };
});

// 计算当前类别下的材料
const currentCategoryMaterials = computed(() => {
  const currentCategoryCode = categories.value[activeCategory.value]?.code;
  return materials[currentCategoryCode] || [];
});

// 计算当前类别下的子类别
const currentSubCategories = computed(() => {
  return categories.value[activeCategory.value]?.subCategories || [];
});

// 组件挂载时执行
onMounted(async () => {
  await fetchCategories(); // 获取类别数据
  loadDraft(); // 加载草稿
});

// 获取类别数据的方法
const fetchCategories = async () => {
  loading.value = true;
  try {
    // 获取类别数据
    const response = await axios.get('/case/findcase'); 
    // 如果请求成功
    if (response.data.statusID === 0) { 
      // 处理类别数据
      categories.value = processCategories(response.data.data); 
    } else {
      // 如果请求失败，抛出错误
      throw new Error(response.data.msg); 
    }
  } catch (error) {
    // 处理获取类别数据失败的错误
    console.error('获取类别数据失败:', error); 
    ElMessage.error('获取类别数据失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 处理类别数据的方法
const processCategories = (data) => {
  // 将后端返回的类别数据转换为前端所需的格式
const processCategories = (data: any[]) => {
  return data.map(category => ({
    code: category.caseID,
    name: category.mainCLs,
    subCategories: [
      {
        code: category.cls1,
        name: category.cls2,
        score: category.point
      }
    ]
  }));
};

// 设置激活的类别索引的方法
const setActiveCategory = (index: number) => {
  activeCategory.value = index;
};

// 显示添加材料对话框的方法
const showAddMaterialDialog = () => {
  // 显示对话框
  materialDialogVisible.value = true; 
  // 重置新建材料数据
  newMaterial.subCategory = '';
  newMaterial.description = '';
  newMaterial.score = 0;
  newMaterial.file = { name: '', url: '' };
  // 重置上传进度
  uploadProgress.value = 0; 
};

// 文件上传成功时的回调函数
const handleUploadSuccess = (res: any, file: any) => {
  // 设置新建材料的文件信息
  newMaterial.file = { name: file.name, url: res.url }; 
  // 设置上传进度为 100%
  uploadProgress.value = 100; 
  // 显示上传成功的提示信息
  ElMessage.success('上传成功'); 
};

// 文件上传失败时的回调函数
const handleUploadError = () => {
  // 显示上传失败的提示信息
  ElMessage.error('上传失败，请重试'); 
};

// 文件上传进度变化时的回调函数
const handleUploadProgress = (event: any, file: any) => {
  // 设置上传进度
  uploadProgress.value = Math.round(event.percent); 
};

// 文件上传前的回调函数
const beforeUpload = (file: any) => {
  // 检查文件大小是否小于 10MB
  const isLt10M = file.size / 1024 / 1024 < 10; 
  // 如果文件大小超过 10MB
  if (!isLt10M) { 
    // 显示文件大小超过限制的提示信息
    ElMessage.error('上传文件大小不能超过 10MB!'); 
  }
  // 返回文件大小是否符合要求
  return isLt10M; 
};

// 添加材料的方法
const addMaterial = async () => {
  // 获取添加材料表单引用
  const materialFormRef = ref<any>(null); 
  // 如果表单引用不存在，则返回
  if (!materialFormRef.value) return; 

  try {
    // 验证添加材料表单
    await materialFormRef.value.validate(); 
    // 获取当前类别的代码
    const currentCategoryCode = categories.value[activeCategory.value].code; 
    // 如果当前类别下还没有材料
    if (!materials[currentCategoryCode]) { 
      // 创建一个空数组来存储材料
      materials[currentCategoryCode] = []; 
    }
    // 查找选中的子类别
    const selectedSubCategory = currentSubCategories.value.find(sc => sc.code === newMaterial.subCategory); 
    // 添加材料到材料数据中
    materials[currentCategoryCode].push({
      ...newMaterial,
      score: selectedSubCategory ? selectedSubCategory.score : 0
    });
    // 关闭添加材料对话框
    materialDialogVisible.value = false; 
    // 显示材料添加成功的提示信息
    ElMessage.success('材料添加成功'); 
  } catch (error) {
    // 处理添加材料失败的错误
    console.error('添加材料失败:', error); 
    ElMessage.error('添加材料失败，请检查输入');
  }
};

// 删除材料的方法
const removeMaterial = (index: number) => {
  // 获取当前类别的代码
  const currentCategoryCode = categories.value[activeCategory.value].code; 
  // 从材料数据中删除指定索引的材料
  materials[currentCategoryCode].splice(index, 1); 
};

// 上一步的方法
const prevCategory = () => {
  if (activeCategory.value > 0) {
    activeCategory.value--;
  }
};

// 下一步的方法
const nextCategory = () => {
  if (activeCategory.value < categories.value.length - 1) {
    activeCategory.value++;
  }
};

// 提交申报的方法
const submitForm = async () => {
  // 设置提交状态
  submitting.value = true; 
  try {
    // 使用 authService 获取当前用户信息
    const user = authService.getCurrentUser(); 
    // 如果用户未登录
    if (!user) { 
      // 抛出错误
      throw new Error('用户未登录'); 
    }

    // 处理材料数据，将其转换为提交数据
    const submitData = Object.entries(materials).flatMap(([categoryCode, categoryMaterials]) =>
      categoryMaterials.map(material => ({
        caseID: categoryCode,
        maxcls: categories.value.find(c => c.code === categoryCode)?.name,
        midcls: material.subCategory,
        mincls: '',
        point: material.score.toString(),
        page: '',
        file: material.file.url,
        priority: '0',
        categorycode: categoryCode
      }))
    );

    // 提交申报
    const response = await axios.post('/record/newrecord', { 
      userID: user.ID, // 使用当前用户的 ID
      records: submitData 
    });

    // 如果请求成功
    if (response.data.statusID === 1) { 
      // 显示申报提交成功的提示信息
      ElMessage.success('申报提交成功'); 
      // 从本地存储中移除草稿
      localStorage.removeItem('reportDraft'); 
      // 清空材料数据
      Object.keys(materials).forEach(key => materials[key] = []); 
    } else {
      // 如果请求失败，抛出错误
      throw new Error(response.data.msg); 
    }
  } catch (error) {
    // 处理提交失败的错误
    console.error('提交失败:', error); 
    ElMessage.error('提交失败，请重试');
  } finally {
    // 设置提交状态为 false
    submitting.value = false; 
  }
};

// 保存草稿的方法
const saveDraft = () => {
  // 将材料数据保存到本地存储
  localStorage.setItem('reportDraft', JSON.stringify(materials)); 
  // 显示草稿保存成功的提示信息
  ElMessage.success('草稿已保存'); 
};

// 加载草稿的方法
const loadDraft = () => {
  // 从本地存储中获取草稿
  const draft = localStorage.getItem('reportDraft'); 
  // 如果草稿存在
  if (draft) { 
    // 显示确认对话框
    ElMessageBox.confirm('发现未提交的草稿，是否加载？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    // 如果用户确认加载草稿
    }).then(() => { 
      // 加载草稿到材料数据中
      Object.assign(materials, JSON.parse(draft)); 
      // 显示草稿加载成功的提示信息
      ElMessage.success('草稿已加载'); 
    // 如果用户取消加载草稿
    }).catch(() => { 
      // 显示取消加载草稿的提示信息
      ElMessage.info('已取消加载草稿'); 
    });
  }
};
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