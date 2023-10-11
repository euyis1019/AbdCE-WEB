import ReportForm from '../views/RF/ReportForm.vue'
import ApplicationRecord from '../views/Record/TestData.vue'
import NotFound from '../views/Notfound/NotFound.vue'
import admin from '../views/admin.vue'
import State from '../views/State.vue'
const routes = [{
        path: "/Record",
        component: ApplicationRecord,
        props : true
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
        path:"/admin",
        name:"admin",
        component:admin,
        props:true
    },
    {
        path: "/state",
        component: State
    }

]

export default routes