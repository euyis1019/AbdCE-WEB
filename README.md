# 综合评价信息申报系统

## 项目概述

本项目是一个基于Vue 3和Element Plus构建的综合评价信息申报系统。该系统为学生提供申报平台,同时为审核员和管理员提供高效的审核和管理工具。系统集成了单点登录(SSO)功能,实现了基于角色的访问控制。

## 系统架构

### 前端技术栈
- 框架: Vue 3
- UI库: Element Plus
- 状态管理: Pinia
- 路由: Vue Router
- HTTP客户端: Axios
- 构建工具: Vue CLI

### 项目结构
```
AbdCE-WEB/
├── src/
│   ├── assets/           # 静态资源
│   ├── components/       # 公共组件
│   ├── router/           # 路由配置
│   ├── services/         # 服务层(API调用)
│   ├── store/            # 状态管理
│   ├── views/            # 页面组件
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── public/               # 公共文件
├── .env                  # 环境变量配置
├── vue.config.js         # Vue CLI配置
└── package.json          # 项目依赖
```

### 核心组件

#### 所有用户可访问
- `MainBox.vue`: 主要布局组件,包含侧边栏和顶部导航
- `HomeView.vue`: 首页dashboard,显示用户基本信息和快速操作入口
- `ReportForm.vue`: 申报表单,用于填写和提交申报信息
- `ReportState.vue`: 申报状态查询,显示用户申报的进度和状态

#### 审核员和管理员可访问
- `AdminTodo.vue`: 审核员待办事项,显示待审核的申报列表
- `ImmersiveReview.vue`: 沉浸式审核界面,用于详细审核单个申报

#### 仅管理员可访问
- `PermissionManagement.vue`: 权限管理页面,用于管理用户角色和权限
- `ReviewManagement.vue`: 复审管理页面,用于管理和分配复审任务
- `DataDashboard.vue`: 数据看板,显示系统整体统计信息和图表

#### 错误页面
- `NotFound.vue`: 404页面,当访问不存在的路由时显示

## 权限控制

系统实现了基于角色的访问控制(RBAC):

1. 路由级别权限控制:
   在`router/index.ts`中,使用`meta`字段标记需要特定权限的路由:
   ```typescript
   {
     path: 'admin/todo',
     name: 'AdminTodo',
     component: AdminTodo,
     meta: { requiresAuth: true, requiresReviewer: true }
   }
   ```

2. 组件级别权限控制:
   在`MainBox.vue`中,根据用户角色动态显示菜单项:
   ```vue
   <el-menu-item index="4" v-if="isReviewer || isAdmin">
     <el-icon><Document /></el-icon>
     <template #title>待办事项</template>
   </el-menu-item>
   ```

3. 用户角色:
   - 普通用户(学生): 可以提交申报,查看申报状态
   - 审核员(班委/级委): 可以查看待办事项,进行审核
   - 管理员: 可以管理用户权限,分配审核任务,查看整体审核进度

## 用户操作流程

1. 登录:
   - 用户访问系统时自动跳转到SSO登录页面
   - 登录成功后返回系统,获取JWT token

2. 学生申报:
   - 在首页点击"填写申报"按钮
   - 填写申报表单,上传相关文件
   - 提交申报,等待审核

3. 审核流程:
   - 审核员登录后在"待办事项"中查看待审核列表
   - 点击"审核"进入沉浸式审核界面
   - 审核员可以通过或拒绝申报,添加评语

4. 结果确认:
   - 学生在"申报状态"页面查看审核结果

## 主要功能

### 学生功能
- 填写和提交申报信息
- 查看申报进度
- 修改和删除未审核的申报

### 审核员功能
- 查看待审核列表
- 进行初审/复审
- 添加审核意见和评分
- 沉浸式审核模式

### 管理员功能
- 管理用户权限
- 分配审核任务
- 查看整体审核进度
- 进行终审

### 通用功能
- 个人信息管理
- 数据看板(统计信息)

## 未完成内容

代码中已经使用TODO关键词注释了未完成的内容。

1. 文件上传功能:
   - 在`ReportForm.vue`中,文件上传API尚未实现:
     ```vue
     // TODO: 后端 API 还没写
     const uploadUrl = '/case/upload';
     ```

2. SSO个人信息页面:
   - 在`MainBox.vue`中,SSO系统的个人信息页面路径未确定:
     ```javascript
     // TODO 待实现, 不知道 SSO 的 profile 页面路径是什么样子
     const goToSSOProfile = () => {
       window.location.href = process.env.VUE_APP_SSO_URL + 'profile';
     };
     ```

3. 类别信息获取:
   - 在`CategoryInfo.vue`组件中,获取类别信息的API尚未实现:
     ```javascript
     // TODO: 后端 API 还没写
     const response = await axios.get('/api/categories');
     ```

4. 数据可视化优化


5. 移动端适配


6. 性能优化


## 开发和部署

### 开发环境设置
```
npm install
npm run serve
```

### 生产环境构建
```
npm run build
```

### 配置
主要配置文件：
- `.env`: 环境变量配置
  ```
  VUE_APP_API_URL=http://ce-backend.abdn.kirisame.cc/
  VUE_APP_SSO_URL=http://sso.abdn.kirisame.cc/ce/
  VUE_APP_ENV=development
  ```
- `vue.config.js`: Vue CLI配置