import http from "../http-common";
class APIService {
    renewToken(data){
        return http.post('RenewToken',data);
    }
    verifyToken(id){
        return http.get(`/VerifyToken?id=${id}`);
    }
    ipReport(data){
        return http.post("/IPReport",data);
    }
    login(id, pass) {
        return http.get(`/login?ID=${id}&pass=${pass}`);
    }
    register(data){
        return http.post("/register", data);
    }
    getScore(id){
        return http.get(`/selfCEScore?ID=${id}`)
    }
    createReport(data){
        return http.post("/NewReport", data);
    }
    modifyReport(data){
        return http.post("/ModifyReport", data);
    }
    queryHistory(id){
        return http.get(`/selfCEHistory?ID=${id}`);
    }
}
export default new APIService();