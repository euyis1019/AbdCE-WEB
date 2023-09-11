import axios from "axios";
export default axios.create({
  baseURL: "http://localhost:1443/admin",
  headers: {
    "Content-type": "application/json"
  }
});