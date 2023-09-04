import ReportForm from '../views/RF/ReportForm.vue'
import ApplicationRecord from '../views/Record/ApplicationRecord.vue'
import NotFound from '../views/Notfound/NotFound.vue'
const routes = [{
        path: "/Record",
        component: ApplicationRecord
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
    }

]

export default routes