<template>
  <span>{{ getFullCategoryPath() }}</span>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/http-common'

const props = defineProps({
  categoryCode: String
})

const categoryTree = ref(null)
const categoryPath = ref([])
const score = ref(0)

onMounted(async () => {
  await fetchCategoryTree()
  findCategoryPath(categoryTree.value, props.categoryCode)
  score.value = findScore(categoryTree.value, props.categoryCode)
})

const fetchCategoryTree = async () => {
  try {
    const response = await axios.get('/case/categorytree')
    if (response.data.statusID === 0) {
      categoryTree.value = response.data.data
    } else {
      console.error('Failed to fetch category tree:', response.data.msg)
    }
  } catch (error) {
    console.error('Error fetching category tree:', error)
  }
}

const findCategoryPath = (tree, targetCode, currentPath = []) => {
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === 'object' && value !== null) {
      if ('caseID' in value && value.caseID.toString() === targetCode) {
        categoryPath.value = [...currentPath, key]
        return true
      }
      if (findCategoryPath(value, targetCode, [...currentPath, key])) {
        return true
      }
    }
  }
  return false
}

const getFullCategoryPath = () => {
  return categoryPath.value.join(' > ')
}

const findScore = (tree, code) => {
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === 'object' && value !== null) {
      if ('caseID' in value && value.caseID.toString() === code) {
        return parseFloat(value.topPoint) || 0
      }
      const result = findScore(value, code)
      if (result !== null) {
        return result
      }
    }
  }
  return null
}

const getScore = () => {
  return score.value
}

defineExpose({
  getScore
})
</script>
```