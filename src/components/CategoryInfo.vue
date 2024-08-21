<template>
  <div class="category-info">
    <slot :categoryData="categoryData">
      <!-- Default slot content -->
      <span>{{ getCategoryTitle(props.categoryCode) }}</span>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from '../http-common';

const props = defineProps<{
  categoryCode: string;
}>();

const categoryData = ref<any>(null);

const fetchCategoryData = async () => {
  try {
    const response = await axios.get('/casecategorytree');
    if (response.data.statusID === 0) {
      categoryData.value = response.data.data;
    } else {
      throw new Error(response.data.msg);
    }
  } catch (error) {
    console.error('获取类别数据失败:', error);
  }
};

const getCategoryTitle = (code: string) => {
  if (!categoryData.value) return code;
  const findCategory = (categories: any[]): string => {
    for (const category of categories) {
      if (category.caseid === code) {
        return category.name;
      }
      if (category.children) {
        const result = findCategory(category.children);
        if (result) return result;
      }
    }
    return '';
  };
  return findCategory(categoryData.value) || code;
};

onMounted(fetchCategoryData);
</script>