import axios from "axios";

const api = axios.create({ baseURL: "" });

api.interceptors.request.use((config) => {
  if (config.method === "get") {
    config.params = { ...config.params, _t: Date.now() };
  }
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401) {
      const slug = localStorage.getItem("escolaSlug");
      localStorage.removeItem("token");
      if (slug) window.location.href = `/new/escola/${slug}/login`;
    }
    return Promise.reject(error);
  }
);

export default api;
