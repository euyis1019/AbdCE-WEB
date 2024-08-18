<template>
    <div class="category-info">
      <slot :categoryData="categoryData">
        <!-- Default slot content -->
        <span>{{ getCategoryTitle(categoryCode) }}</span>
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
      // TODO: 后端 API 还没写
      const response = await axios.get('/api/categories');
      categoryData.value = response.data;
    } catch (error) {
      console.error('Failed to fetch category data:', error);
    }
  };
  
  const getCategoryTitle = (code: string) => {
    if (!categoryData.value) return code;
    const category = categoryData.value.find((cat: any) => cat.code === code);
    return category ? category.title : code;
  };
  
  onMounted(fetchCategoryData);
  </script>