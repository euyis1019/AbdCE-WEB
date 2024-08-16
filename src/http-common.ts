import axios from "axios";

export default axios.create({
  baseURL: "http://ce-backend.abdn.kirisame.cc",
  headers: {
    "Content-type": "application/json"
  }
});