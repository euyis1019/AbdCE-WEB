import ReportForm from '../views/RF/ReportForm.vue'
import ApplicationRecord from '../views/Record/TestData.vue'
import NotFound from '../views/Notfound/NotFound.vue'
import admin from '../views/admin.vue'
import State from '../views/State.vue'
import ReportState from '../views/RF/ReportState.vue'
import Register from '../LoginRegister/Register.vue'
import ManagePermission from '../views/managePermission.vue'
const routes = [
    {
        path: "/Record",
        component: ApplicationRecord,
        props: true
    },
    {
        path: "/Report",
        component: ReportForm
    },
    {
        path: "/",
        redirect: "/Record"
    },
    {
        path: "/:pathMatch(.*)*",
        name: "Notfound",
        component: NotFound
    },
    {
        path: "/admin",
        name: "admin",
        component: admin,
        props: true
    },
    {
        path: "/state",
        component: State
    },
    {
        path: "/reportstate",
        component: ReportState
    },
    {
        path: "/managepermission",
        component: ManagePermission // 半成品的权限管理页面（约等于没做）
    }
]

export default routes