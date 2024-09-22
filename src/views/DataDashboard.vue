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
        <el-table-column prop="FileID" label="文件ID" width="280" sortable="custom" />
        <el-table-column label="类别" width="180">
          <template #default="scope">
            <CategoryInfo :categoryCode="scope.row.categorycode" />
          </template>
        </el-table-column>
        <el-table-column prop="applicationTime" label="提交时间" width="180" sortable="custom">
          <template #default="scope">
            {{ formatDate(scope.row.applicationTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120" sortable="custom">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row)">{{ getStatusLabel(scope.row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="point" label="分数" width="80" sortable="custom" />
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
import { ref, computed, onMounted, nextTick, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { Search, Document, Check, InfoFilled, Close, Warning } from '@element-plus/icons-vue'
import axios from '../http-common'
import { debounce } from 'lodash'
import { useAuthStore } from '@/store/auth'
import Statistic from '@/components/Statistic.vue'
import CategoryInfo from '@/components/CategoryInfo.vue'

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
  { title: '待初审', value: 0, icon: InfoFilled },
  { title: '待终审', value: 0, icon: Check },
  { title: '已审核', value: 0, icon: Check },
  { title: '争议数', value: 0, icon: Warning }
])

// 图表配置
const charts = ref([
  { id: 'statusChart', instance: null },
  { id: 'timelineChart', instance: null }
])

// 获取仪表板数据
const fetchData = async () => {
  loading.value = true
  try {
    const [response, categoryResponse] = await Promise.all([
      axios.get('/admin/getCE', {
        params: {
          userID: authStore.currentUser?.StudentId,
          page: currentPage.value,
          pageSize: pageSize.value
        }
      }),
      axios.get('/case/categorytree')
    ])

    if (response.data.statusID !== 0) {
      throw new Error(response.data.msg || '获取数据失败')
    }

    const data = response.data.data
    console.log('API response data:', data) // 用于调试

    // 合并所有文件列表
    allData.value = [
      ...(data.reviewTodoList?.files || []),
      ...(data.finalTodoList?.files || []),
      ...(data.reviewDownList?.files || []),
      ...(data.disputeList?.files || []),
      ...(data.reviewerGradeList?.files || []),
      ...(data.reviewerAcademyList?.files || []),
      ...(data.gradeDisagreeList?.files || [])
    ]

    totalItems.value = allData.value.length
    categoryTree.value = categoryResponse.data.data
    updateStatistics(data)
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
  statistics.value[0].value = totalItems.value
  statistics.value[1].value = data.reviewTodoList?.files?.length || 0
  statistics.value[2].value = data.finalTodoList?.files?.length || 0
  statistics.value[3].value = data.reviewDownList?.files?.length || 0
  statistics.value[4].value = (data.disputeList?.files?.length || 0) + 
                              (data.gradeDisagreeList?.files?.length || 0)
}

// 根据搜索条件过滤数据
const filteredData = computed(() => {
  if (!searchQuery.value) return allData.value
  const query = searchQuery.value.toLowerCase()
  return allData.value.filter(item => 
    Object.values(item).some(value => 
      String(value).toLowerCase().includes(query)
    )
  )
})

// 处理搜索操作（防抖）
const handleSearch = debounce(() => {
  currentPage.value = 1
}, 300)

// 处理表格排序
const handleSortChange = ({ prop, order }) => {
  allData.value.sort((a, b) => {
    if (order === 'ascending') {
      return a[prop] > b[prop] ? 1 : -1
    } else {
      return a[prop] < b[prop] ? 1 : -1
    }
  })
}

// 获取状态对应的标签类型
const getStatusType = (row) => {
  if (row.isDone === 0 && !row.finalDone) return 'warning' // 待初审
  if (row.isDone === 1 && !row.finalDone) return 'info' // 待终审
  if (row.finalDone) return 'success' // 已通过
  return 'danger' // 争议或其他状态
}

// 获取状态标签
const getStatusLabel = (row) => {
  if (row.isDone === 0 && !row.finalDone) return '待初审'
  if (row.isDone === 1 && !row.finalDone) return '待终审'
  if (row.finalDone) return '已通过'
  return '争议'
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
    '待初审': statistics.value[1].value,
    '待终审': statistics.value[2].value,
    '已审核': statistics.value[3].value,
    '争议': statistics.value[4].value
  }

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
    date: new Date(item.applicationTime).toLocaleDateString(),
    status: getStatusLabel(item)
  }))

  const statusCounts = timeData.reduce((acc, curr) => {
    if (!acc[curr.date]) {
      acc[curr.date] = { '待初审': 0, '待终审': 0, '已通过': 0, '争议': 0 }
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
      data: ['待初审', '待终审', '已通过', '争议'],
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
        name: '待终审',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: chartData.map(item => item['待终审'])
      },
      {
        name: '已通过',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: chartData.map(item => item['已通过'])
      },
      {
        name: '争议',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: chartData.map(item => item['争议'])
      }
    ]
  }
  myChart.setOption(option)
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

// 获取统计卡片的颜色
const getStatColor = (index: number) => {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399']
  return colors[index % colors.length]
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