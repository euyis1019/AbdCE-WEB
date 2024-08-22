<template>
  <div class="category-info">
    <el-tooltip :content="fullCategoryPath" placement="top" effect="light">
      <span>{{ displayCategory }}</span>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from '../http-common';

const props = defineProps<{
  categoryCode: string;
}>();

const categoryData = ref<any>(null);
const fullCategoryPath = ref('');
const displayCategory = computed(() => {
  const parts = fullCategoryPath.value.split(' > ');
  return parts.length > 2 ? `${parts[0]} > ... > ${parts[parts.length - 1]}` : fullCategoryPath.value;
});

const fetchCategoryData = async () => {
  try {
    const response = await axios.get('/case/categorytree');
    if (response.data.statusID === 0) {
      categoryData.value = response.data.data;
      fullCategoryPath.value = getCategoryPath(props.categoryCode);
    } else {
      throw new Error(response.data.msg);
    }
  } catch (error) {
    console.error('获取类别数据失败:', error);
  }
};

const getCategoryPath = (code: string): string => {
  if (!categoryData.value) return code;
  const result = findCategoryByCode(categoryData.value, code);
  if (result) {
    return result[0].join(' > ');
  }
  return code;
};

const findCategoryByCode = (tree: any, code: string): [string[], any] | null => {
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === 'object' && value !== null) {
      if ('caseID' in value && value.caseID === parseInt(code)) {
        return [[key], value];
      }
      const result = findCategoryByCode(value, code);
      if (result) {
        return [[key, ...result[0]], result[1]];
      }
    }
  }
  return null;
};

onMounted(fetchCategoryData);
</script>

<style scoped>
.category-info {
  max-width: 400px;
  overflow: hidden;
}
</style>
