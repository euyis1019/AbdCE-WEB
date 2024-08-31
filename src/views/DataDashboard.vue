<template>
  <div class="data-dashboard">
    <h1>数据看板</h1>

    <el-row :gutter="20" class="dashboard-stats">
      <el-col :xs="24" :sm="12" :md="6" v-for="(stat, index) in statistics" :key="stat.title">
        <el-card shadow="hover" :body-style="{ padding: '20px' }">
          <statistic 
            :title="stat.title" 
            :value="stat.value" 
            :icon="stat.icon"
            :color="getStatColor(index)" 
          />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="dashboard-charts">
      <el-col :xs="24" :sm="24" :md="12">
        <el-card :body-style="{ padding: '20px', height: '400px' }">
          <div :id="charts[0].id" :style="{ width: '100%', height: '100%' }"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12">
        <el-card :body-style="{ padding: '20px', height: '400px' }">
          <div :id="charts[1].id" :style="{ width: '100%', height: '100%' }"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="dashboard-table">
      <template #header>
        <div class="card-header">
          <span>填报详情</span>
          <el-input
            v-model="searchQuery"
            placeholder="搜索任意字段"
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
        v-loading="loading"
        :data="filteredData"
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column
          v-for="column in visibleColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          sortable="custom"
          :min-width="column.minWidth"
        >
          <template #default="{ row }">
            <template v-if="column.prop === 'status'">
              <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
            </template>
            <template v-else-if="column.prop === 'createdAt' || column.prop === 'updatedAt'">
              {{ formatDate(row[column.prop]) }}
            </template>
            <template v-else-if="column.prop === 'caseID'">
              {{ getCategoryPath(row.caseID) }}
            </template>
            <template v-else>
              {{ row[column.prop] }}
            </template>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalItems"
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
import { Search, Document, Check, InfoFilled, Close } from '@element-plus/icons-vue'
import axios from '../http-common'
import { debounce } from 'lodash'
import { useAuthStore } from '@/store/auth'
import Statistic from '@/components/Statistic.vue'

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
const pageSize = ref(50)
const allData = ref([])
const totalItems = ref(0)
const categoryTree = ref({})

// 统计数据
const statistics = ref([
  { title: '总提交数', value: 0, icon: Document },
  { title: '待审核', value: 0, icon: InfoFilled },
  { title: '初审通过', value: 0, icon: Check },
  { title: '终审通过', value: 0, icon: Check }
])

// 图表配置
const charts = ref([
  { id: 'statusChart', instance: null },
  { id: 'timelineChart', instance: null }
])

// 动态列配置
const columns = ref([])
const visibleColumns = computed(() => {
  return columns.value.filter(column => column.prop !== 'fileID')
})

// 获取仪表板数据
const fetchData = async () => {
  loading.value = true
  try {
    const [response, categoryResponse] = await Promise.all([
      axios.get('/record/getallfilestatus', {
        params: {
          page: currentPage.value,
          pagesize: pageSize.value,
          userID: authStore.currentUser?.ID
        }
      }),
      axios.get('/case/categorytree')
    ])

    if (response.data.statusID !== 1) {
      throw new Error(response.data.msg || '获取数据失败')
    }

    allData.value = response.data.fileStatuses
    totalItems.value = response.data.fileStatuses.length // 注意：这里可能需要后端提供总数
    categoryTree.value = categoryResponse.data.data
    updateStatistics(response.data)
    updateColumns()
    await nextTick()
    updateCharts()
  } catch (error) {
    console.error('Error fetching data:', error)
    ElMessage.error('获取数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 更新统计数据
const updateStatistics = (data) => {
  statistics.value[0].value = data.fileStatuses.length
  statistics.value[1].value = data.pendingReviewCount
  statistics.value[2].value = data.reviewPassedCount
  statistics.value[3].value = data.finalReviewPassedCount
}

// 更新列配置
const updateColumns = () => {
  if (allData.value.length === 0) return
  const sampleData = allData.value[0]
  columns.value = Object.keys(sampleData).map(key => ({
    prop: key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    minWidth: key === 'fileID' || key === 'userID' ? '280' : key === 'caseID' ? '300' : '120'
  }))
}

// 根据搜索条件过滤数据
const filteredData = computed(() => {
  if (!searchQuery.value) return allData.value
  const query = searchQuery.value.toLowerCase()
  return allData.value.filter(item => 
    Object.values(item).some(value => 
      String(value).toLowerCase().includes(query)
    ) || getCategoryPath(item.caseID).toLowerCase().includes(query)
  )
})

// 处理搜索操作（防抖）
const handleSearch = debounce(() => {
  currentPage.value = 1
}, 300)

// 处理表格排序
const handleSortChange = ({ prop, order }) => {
  allData.value.sort((a, b) => {
    if (prop === 'caseID') {
      const pathA = getCategoryPath(a.caseID)
      const pathB = getCategoryPath(b.caseID)
      return order === 'ascending' ? pathA.localeCompare(pathB) : pathB.localeCompare(pathA)
    }
    if (order === 'ascending') {
      return a[prop] > b[prop] ? 1 : -1
    } else {
      return a[prop] < b[prop] ? 1 : -1
    }
  })
}

// 处理页面大小变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  fetchData()
}

// 处理页码变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchData()
}

// 获取状态对应的标签类型
const getStatusType = (status: string) => {
  switch (status) {
    case '待初审': return 'warning'
    case '初审通过': return 'success'
    case '终审通过': return 'success'
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
  nextTick(() => {
    createStatusChart()
    createTimelineChart()
  })
}

// 创建状态分布图表
const createStatusChart = () => {
  const statusCount = {
    '待初审': 0,
    '初审通过': 0,
    '终审通过': 0
  }
  allData.value.forEach(item => {
    statusCount[item.status] = (statusCount[item.status] || 0) + 1
  })

  const chartDom = document.getElementById('statusChart')
  const myChart = charts.value[0].instance || echarts.init(chartDom)
  charts.value[0].instance = myChart
  const option = {
    title: { 
      text: '审核状态分布',
      left: 'center',
      top: 20
    },
    tooltip: { 
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: { 
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [
      {
        name: '审核状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: Object.entries(statusCount).map(([name, value]) => ({ name, value }))
      }
    ]
  }
  myChart.setOption(option)
}

// 创建时间线图表
const createTimelineChart = () => {
  const timeData = allData.value.map(item => ({
    date: new Date(item.createdAt).toLocaleDateString(),
    status: item.status
  }))

  const statusCounts = timeData.reduce((acc, curr) => {
    if (!acc[curr.date]) {
      acc[curr.date] = { '待初审': 0, '初审通过': 0, '终审通过': 0 }
    }
    acc[curr.date][curr.status]++
    return acc
  }, {})

  const chartData = Object.entries(statusCounts).map(([date, counts]) => ({
    date,
    ...counts
  }))

  chartData.sort((a, b) => new Date(a.date) - new Date(b.date))

  const chartDom = document.getElementById('timelineChart')
  const myChart = charts.value[1].instance || echarts.init(chartDom)
  charts.value[1].instance = myChart
  const option = {
    title: {
      text: '审核状态时间线',
      left: 'center',
      top: 20
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    legend: {
      data: ['待初审', '初审通过', '终审通过'],
      bottom: 10
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: chartData.map(item => item.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '待初审',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: chartData.map(item => item['待初审'])
      },
      {
        name: '初审通过',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: chartData.map(item => item['初审通过'])
      },
      {
        name: '终审通过',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: chartData.map(item => item['终审通过'])
      }
    ]
  }
  myChart.setOption(option)
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

// 获取分类路径
const getCategoryPath = (caseID: string | number) => {
  const findPath = (tree, id, path = []) => {
    for (const [key, value] of Object.entries(tree)) {
      if (typeof value === 'object' && value !== null) {
        if ('caseID' in value && value.caseID && id && value.caseID.toString() === id.toString()) {
          return [...path, key]
        }
        const result = findPath(value, id, [...path, key])
        if (result) return result
      }
    }
    return null
  }

  try {
    const path = findPath(categoryTree.value, caseID)
    return path ? path.join(' > ') : '未知类别'
  } catch (error) {
    console.error('Error in getCategoryPath:', error)
    return '未知类别'
  }
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
.data-dashboard {
  padding: 20px;
}

.dashboard-stats, .dashboard-charts {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-table {
  margin-top: 20px;
}

.el-table {
  width: 100% !important;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .data-dashboard {
    padding: 10px;
  }

  .el-col {
    margin-bottom: 10px;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .card-header .el-input {
    margin-top: 10px;
    width: 100%;
  }
}
</style>
