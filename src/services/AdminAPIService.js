import http from "../http-admin";
class AdminAPIService{
    updateReport(data){
        return http.post('/admin/update',data)
    }
    
}
export default new AdminAPIService();