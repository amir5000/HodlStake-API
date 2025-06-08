import axios from "axios";
import config from "./config";

const apiInstance = axios.create({
    baseURL: config.api.baseUrl,
});

export default apiInstance;