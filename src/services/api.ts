import axios from 'axios';

const api = axios.create({
    baseURL: 'https://192.168.15.8:5001/api'
});

export default api;
