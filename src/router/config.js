import ReportForm from '../views/RF/ReportForm.vue'
import ApplicationRecord from '../views/Record/ApplicationRecord.vue'

const routes = [{
        path: "/Record",
        component: ApplicationRecord
    },

    {
        path: "/Report",
        component: ReportForm
    }

]

export default routes