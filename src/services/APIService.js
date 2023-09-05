import http from "../http-common";
class APIService {
    ipReport(data){
        return http.post("/IPReport",data);
    }
    login(id, pass) {
        return http.post(`/login?ID=${id}&pass=${pass}`);
    }
    register(data){
        return http.post("/register", data);
    }
    getScore(id){
        return http.get(`/selfCE/score?ID=${id}`)
    }
    createReport(data){
        return http.post("/report/new", data);
    }
    modifyReport(data){
        return http.post("/report/modify", data);
    }
    queryHistory(id){
        return http.get(`/selfCE/history?ID=${id}`);
    }
}
export default new APIService();