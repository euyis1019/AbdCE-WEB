import http from "../http-admin";
class AdminAPIService{
    updateReport(data){
        return http.post('/update',data)
    }
    
}
export default new AdminAPIService();