import http from "../http-common"
class APIService {
    constructor() {
        http.defaults.headers["Content-type"] = "multipart/form-data";
      }
    submitfile(){
        return http.post
    } 
}
//export default new Fileservice();