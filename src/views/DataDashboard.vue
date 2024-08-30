<template>
  <div class="data-dashboard">
    <h1>数据看板</h1>

    <el-row :gutter="20" class="dashboard-stats">
      <el-col :xs="24" :sm="12" :md="6" v-for="(stat, index) in statistics" :key="stat.title">
        <el-skeleton style="width: 100%" :loading="loading" animated>
          <template #template>
            <el-card shadow="hover" :body-style="{ padding: '20px' }">
              <el-skeleton-item variant="p" style="width: 50%" />
              <el-skeleton-item variant="text" style="width: 100%" />
            </el-card>
          </template>
          <template #default>
            <el-card shadow="hover" :body-style="{ padding: '20px' }">
              <statistic 
                :title="stat.title" 
                :value="stat.value" 
                :icon="stat.icon"
                :color="getStatColor(index)" 
              />
            </el-card>
          </template>
        </el-skeleton>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="dashboard-charts">
      <el-col :xs="24" :sm="12" v-for="chart in charts" :key="chart.id">
        <el-skeleton style="width: 100%" :loading="loading" animated>
          <template #template>
            <div style="padding: 14px">
              <el-skeleton-item variant="p" style="width: 50%" />
              <el-skeleton-item variant="text" style="margin-top: 16px; height: 300px" />
            </div>
          </template>
          <template #default>
            <el-card :body-style="{ padding: '0px', height: '400px' }">
              <div :id="chart.id" :style="{ width: '100%', height: '100%' }"></div>
            </el-card>
          </template>
        </el-skeleton>
      </el-col>
    </el-row>

    <el-card class="dashboard-table">
      <template #header>
        <div class="card-header">
          <span>填报详情</span>
          <el-input
            v-model="searchQuery"
            placeholder="搜索姓名、分类或状态"
            style="width: 300px;"
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </template>
      <el-table
        v-loading="tableLoading"
        :data="paginatedData"
        style="width: 100%"
        height="400"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="name" label="姓名" sortable="custom">
          <template #default="{ row }">
            <el-skeleton v-if="tableLoading" style="width: 100%" animated>
              <template #template>
                <el-skeleton-item variant="text" style="width: 50%" />
              </template>
            </el-skeleton>
            <span v-else>{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="categoryCode" label="填报分类" sortable="custom">
          <template #default="{ row }">
            <el-skeleton v-if="tableLoading" style="width: 100%" animated>
              <template #template>
                <el-skeleton-item variant="text" style="width: 80%" />
              </template>
            </el-skeleton>
            <CategoryInfo v-else :categoryCode="row.categoryCode" />
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" sortable="custom">
          <template #default="{ row }">
            <el-skeleton v-if="tableLoading" style="width: 100%" animated>
              <template #template>
                <el-skeleton-item variant="text" style="width: 100%" />
              </template>
            </el-skeleton>
            <el-progress v-else :percentage="row.progress" />
          </template>
        </el-table-column>
        <el-table-column prop="score" label="得分" sortable="custom">
          <template #default="{ row }">
            <el-skeleton v-if="tableLoading" style="width: 100%" animated>
              <template #template>
                <el-skeleton-item variant="text" style="width: 30%" />
              </template>
            </el-skeleton>
            <span v-else>{{ row.score }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" sortable="custom">
          <template #default="{ row }">
            <el-skeleton v-if="tableLoading" style="width: 100%" animated>
              <template #template>
                <el-skeleton-item variant="text" style="width: 40%" />
              </template>
            </el-skeleton>
            <el-tag v-else :type="getStatusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredData.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { Search, Document, Check, InfoFilled, DataLine } from '@element-plus/icons-vue'
import axios from '../http-common'
import { debounce } from 'lodash'
import { useAuthStore } from '@/store/auth'
import CategoryInfo from '@/components/CategoryInfo.vue'
import Statistic from '@/components/Statistic.vue'
import { flattenCategoryTree, FlatCategory } from '@/utils/categoryUtils'

const router = useRouter()
const authStore = useAuthStore()

// 检查用户权限
if (authStore.permissionLevel < 30) {
  ElMessage.error('您没有权限访问此页面')
  router.push('/')
}

// 状态变量
const loading = ref(true)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const tableLoading = ref(true)
const allData = ref([])
const categoryTree = ref({})
const flatCategories = ref<FlatCategory[]>([])

// 统计数据
const statistics = ref([
  { title: '总提交数', value: 0, icon: Document },
  { title: '待审核', value: 0, icon: InfoFilled },
  { title: '已完成审核', value: 0, icon: Check },
  { title: '平均分数', value: 0, icon: DataLine }
])

// 图表配置
const charts = ref([
  { id: 'categoryChart', instance: null },
  { id: 'statusChart', instance: null }
])

// 获取仪表板数据
const fetchData = async () => {
  loading.value = true
  tableLoading.value = true
  try {
    // 并行请求overview和category tree数据
    const [overviewResponse, categoryResponse] = await Promise.all([
      axios.get('/admin/overview'),
      axios.get('/case/categorytree')
    ])
    
    allData.value = overviewResponse.data.submissions
    categoryTree.value = categoryResponse.data
    // 将类别树扁平化，便于后续处理
    flatCategories.value = flattenCategoryTree(categoryTree.value)
    
    updateStatistics(overviewResponse.data.statistics)
    await nextTick()
    updateCharts()
  } catch (error) {
    console.error('Error fetching data:', error)
    ElMessage.error('获取数据失败，请稍后重试')
  } finally {
    loading.value = false
    tableLoading.value = false
  }
}

// 更新统计数据
const updateStatistics = (stats) => {
  statistics.value[0].value = stats.totalSubmissions
  statistics.value[1].value = stats.pendingReviews
  statistics.value[2].value = stats.completedReviews
  statistics.value[3].value = stats.averageScore.toFixed(2)
}

// 根据搜索条件过滤数据
const filteredData = computed(() => {
  if (!searchQuery.value) return allData.value
  const query = searchQuery.value.toLowerCase()
  return allData.value.filter(item => {
    const category = flatCategories.value.find(cat => cat.code === item.categoryCode)
    return item.name.toLowerCase().includes(query) ||
           (category && category.path.toLowerCase().includes(query)) ||
           item.status.toLowerCase().includes(query)
  })
})

// 计算当前页的数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

// 处理搜索操作（防抖）
const handleSearch = debounce(() => {
  currentPage.value = 1
}, 300)

// 处理表格排序
const handleSortChange = ({ prop, order }) => {
  allData.value.sort((a, b) => {
    if (prop === 'categoryCode') {
      // 对于类别，我们需要比较完整的类别路径
      const catA = flatCategories.value.find(cat => cat.code === a.categoryCode)
      const catB = flatCategories.value.find(cat => cat.code === b.categoryCode)
      return order === 'ascending' 
        ? catA.path.localeCompare(catB.path)
        : catB.path.localeCompare(catA.path)
    }
    // 对于其他属性，直接比较值
    if (a[prop] < b[prop]) return order === 'ascending' ? -1 : 1
    if (a[prop] > b[prop]) return order === 'ascending' ? 1 : -1
    return 0
  })
}

// 处理页面大小变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

// 处理页码变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 获取状态对应的标签类型
const getStatusType = (status: string) => {
  switch (status) {
    case '待审核': return 'warning'
    case '已通过': return 'success'
    case '已拒绝': return 'danger'
    default: return 'info'
  }
}

// 获取统计卡片的颜色
const getStatColor = (index: number) => {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']
  return colors[index % colors.length]
}

// 更新所有图表
const updateCharts = () => {
  createCategoryChart()
  createStatusChart()
}

// 创建类别分布图表
const createCategoryChart = () => {
  // 统计各顶级类别的数量
  const categoryCount = {}
  allData.value.forEach(item => {
    const category = flatCategories.value.find(cat => cat.code === item.categoryCode)
    if (category) {
      const topCategory = category.path.split(' > ')[0]
      categoryCount[topCategory] = (categoryCount[topCategory] || 0) + 1
    }
  })
  
  const chartDom = document.getElementById('categoryChart')
  // 如果图表实例已存在，则重用；否则创建新实例
  const myChart = charts.value[0].instance || echarts.init(chartDom)
  charts.value[0].instance = myChart
  const option = {
    title: { text: '填报分类分布' },
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left', type: 'scroll' },
    series: [
      {
        type: 'pie',
        radius: '50%',
        data: Object.entries(categoryCount).map(([name, value]) => ({ name, value })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  myChart.setOption(option)
}

// 创建状态分布图表
const createStatusChart = () => {
  const statusCount = {
    '待审核': 0,
    '已通过': 0,
    '已拒绝': 0
  }
  allData.value.forEach(item => {
    statusCount[item.status] = (statusCount[item.status] || 0) + 1
  })
  
  const chartDom = document.getElementById('statusChart')
  // 如果图表实例已存在，则重用；否则创建新实例
  const myChart = charts.value[1].instance || echarts.init(chartDom)
  charts.value[1].instance = myChart
  const option = {
    title: { text: '审核状态分布' },
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: '20', fontWeight: 'bold' } },
        labelLine: { show: false },
        data: Object.entries(statusCount).map(([name, value]) => ({ name, value }))
      }
    ]
  }
  myChart.setOption(option)
}

// 定时刷新数据
const refreshInterval = setInterval(() => {
  fetchData()
}, 60000) // 每分钟刷新一次

onMounted(() => {
  fetchData()
})

onUnmounted(() => {
  clearInterval(refreshInterval)
  // 清理图表实例，避免内存泄漏
  charts.value.forEach(chart => {
    if (chart.instance) {
      chart.instance.dispose()
    }
  })
})

// 处理窗口大小变化，调整图表大小
const handleResize = debounce(() => {
  charts.value.forEach(chart => {
    if (chart.instance) {
      chart.instance.resize()
    }
  })
}, 100)

window.addEventListener('resize', handleResize)

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 监听路由变化，如果离开页面则清除定时器
watch(() => router.currentRoute.value.path, (newPath) => {
  if (newPath !== '/data-dashboard') {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
/* 整体布局 */
.data-dashboard {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
}

h1 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 20px;
}

/* 统计卡片样式 */
.dashboard-stats {
  margin-bottom: 20px;
}

.dashboard-stats .el-card {
  height: 100%;
  transition: all 0.3s ease;
}

.dashboard-stats .el-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
}

/* 图表样式 */
.dashboard-charts {
  margin-bottom: 20px;
}

.dashboard-charts .el-card {
  height: 400px;
  overflow: hidden;
}

/* 表格样式 */
.dashboard-table {
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e6e6e6;
}

.el-table {
  margin-top: 20px;
}

/* 分页器样式 */
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding: 10px 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .data-dashboard {
    padding: 10px;
  }

  .dashboard-stats .el-col,
  .dashboard-charts .el-col {
    margin-bottom: 20px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-header .el-input {
    margin-top: 10px;
    width: 100%;
  }

  .dashboard-table {
    overflow-x: auto;
  }

  .el-table {
    width: 100%;
    overflow-x: scroll;
  }

  .pagination-container {
    justify-content: center;
  }
}

/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background-color: #909399;
  border-radius: 3px;
}

::-webkit-scrollbar-track {
  background-color: #f0f2f5;
}

/* 动画效果 */
.el-card {
  transition: all 0.3s ease;
}

.el-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 加载动画样式 */
.el-loading-spinner .circular {
  animation: loading-rotate 2s linear infinite;
}

@keyframes loading-rotate {
  100% {
    transform: rotate(360deg);
  }
}

/* 骨架屏样式调整 */
.el-skeleton {
  width: 100%;
}

.el-skeleton__paragraph {
  margin-top: 0 !important;
}

/* 图表容器样式 */
.dashboard-charts .el-card__body {
  padding: 0;
  height: 100%;
}

/* 表格内容样式优化 */
.el-table .cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.el-table .el-tag {
  margin-right: 5px;
}

/* 搜索框样式 */
.el-input-group__prepend {
  background-color: #f5f7fa;
}

.el-input__inner:focus {
  border-color: #409EFF;
}

/* 统计数字卡片样式增强 */
.dashboard-stats .el-card__body {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 图表标题样式 */
.echarts .chart-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

/* 添加一些微妙的背景图案 */
.data-dashboard {
  background-image: 
    linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: center center;
}
</style>