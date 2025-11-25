// src/api.js
import axios from 'axios';

// ✅ تنظیم هوشمند آدرس API
// اگر در محیط توسعه (npm run dev) هستید، به لوکال‌هاست وصل می‌شود.
// اگر بیلد شده و روی سرور است، به همان دامنه‌ای که سایت روی آن باز است وصل می‌شود.
// const API_URL = import.meta.env.DEV ? '' : '';
// نکته: اگر روی سرور داکر هستید و مشکل اتصال دارید، http://127.0.0.1:8000خط بالا را کامنت کنید و خط زیر را با IP سرور فعال کنید:
// const API_URL = 'http://104.234.196.110:8000';

const apiClient = axios.create({
  baseURL: API_URL,
});

// ۱. اینترسپتور درخواست: افزودن توکن به هدر
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ۲. اینترسپتور پاسخ: مدیریت تمدید توکن (Refresh Token)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // اگر خطای 401 (عدم دسترسی) گرفتیم و قبلاً تلاش نکرده‌ایم
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            throw new Error("No refresh token available");
        }

        // تلاش برای دریافت توکن جدید
        // نکته: برای رفرش حتما باید آدرس کامل باشد اگر API_URL خالی است
        const baseURL = API_URL || window.location.origin;
        const response = await axios.post(`${baseURL}/api/v1/token/refresh/`, {
          refresh: refreshToken
        });

        const { access } = response.data;

        // ذخیره توکن جدید
        localStorage.setItem('access_token', access);

        // تلاش مجدد درخواست قبلی با توکن جدید
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        console.error("Session expired or refresh failed:", refreshError);
        // پاک کردن توکن‌ها و هدایت به لاگین
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// --- توابع احراز هویت ---
export const loginUser = (username, password) => apiClient.post('/api/v1/token/', { username, password });

// --- مدیریت پروژه‌ها ---
export const getProjects = () => apiClient.get('/api/v1/projects/');
export const getProjectDetails = (id) => apiClient.get(`/api/v1/projects/${id}/`);
export const createProject = (data) => apiClient.post('/api/v1/projects/', data);
export const updateProject = (id, data) => apiClient.patch(`/api/v1/projects/${id}/`, data);
export const deleteProject = (id) => apiClient.delete(`/api/v1/projects/${id}/`);

// --- مدیریت سناریوها ---
export const getScenarios = (id) => apiClient.get(`/api/v1/projects/${id}/scenarios/`);
export const createScenario = (id, data) => apiClient.post(`/api/v1/projects/${id}/scenarios/`, data);
export const updateScenario = (sId, data, pId) => apiClient.patch(`/api/v1/projects/${pId}/scenarios/${sId}/`, data);
export const deleteScenario = (sId, pId) => apiClient.delete(`/api/v1/projects/${pId}/scenarios/${sId}/`);

// --- تقویم و رویدادها ---
export const getCalendarEvents = (id) => apiClient.get(`/api/v1/projects/${id}/calendar-events/`);
export const createCalendarEvent = (id, data) => apiClient.post(`/api/v1/projects/${id}/calendar-events/`, data);
export const deleteCalendarEvent = (pId, eId) => apiClient.delete(`/api/v1/projects/${pId}/calendar-events/${eId}/`);
export const getAllCalendarEvents = () => apiClient.get('/api/v1/all-events/');

// --- گزارشات ---
export const getWeeklyReports = (id) => apiClient.get(`/api/v1/projects/${id}/weekly-reports/`);
export const updateMonthlyReport = (id, content) => apiClient.patch(`/api/v1/projects/${id}/`, { monthly_report_text: content });
export const updateOrCreateWeeklyReport = (pId, week, rId, content) => {
    if (rId) return apiClient.patch(`/api/v1/projects/${pId}/weekly-reports/${rId}/`, { report_text: content });
    return apiClient.post(`/api/v1/projects/${pId}/weekly-reports/`, { week_number: week, report_text: content });
};

// --- مدیریت فایل‌ها ---
export const getProjectFiles = (id) => apiClient.get(`/api/v1/projects/${id}/files/`);
export const uploadProjectFile = (id, data) => apiClient.post(`/api/v1/projects/${id}/files/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteProjectFile = (pId, fId) => apiClient.delete(`/api/v1/projects/${pId}/files/${fId}/`);

// --- مدیریت کاربران و پرسنل ---
export const getUsers = () => apiClient.get('/api/v1/users/');
export const getClients = () => apiClient.get('/api/v1/users/?role=client');
export const getUsersByRole = (role) => apiClient.get(`/api/v1/users/?role=${role}`);
export const createUser = (data) => apiClient.post('/api/v1/users/', data);
export const updateUser = (id, data) => apiClient.patch(`/api/v1/users/${id}/`, data);
export const deleteUser = (id) => apiClient.delete(`/api/v1/users/${id}/`);

// --- پروفایل کاربری ---
export const getUserProfile = () => apiClient.get('/api/v1/users/profile/');
export const updateUserProfile = (data) => apiClient.patch('/api/v1/users/profile/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const changePassword = (data) => apiClient.post('/api/v1/users/change-password/', data);

// --- مدیریت مالی پروژه ---
export const getProjectPayments = (id) => apiClient.get(`/api/v1/projects/${id}/payments/`);
export const createProjectPayment = (id, data) => apiClient.post(`/api/v1/projects/${id}/payments/`, data);
export const deleteProjectPayment = (pId, payId) => apiClient.delete(`/api/v1/projects/${pId}/payments/${payId}/`);
export const getProjectExpenses = (id) => apiClient.get(`/api/v1/projects/${id}/expenses/`);
export const createProjectExpense = (id, data) => apiClient.post(`/api/v1/projects/${id}/expenses/`, data);
export const deleteProjectExpense = (pId, exId) => apiClient.delete(`/api/v1/projects/${pId}/expenses/${exId}/`);
export const exportProjectFinancials = (id) => apiClient.get(`/api/v1/projects/${id}/export-financials/`, { responseType: 'blob' });

// --- امور مالی آژانس ---
export const getSalaries = () => apiClient.get('/api/v1/salaries/');
export const createSalary = (data) => apiClient.post('/api/v1/salaries/', data);
export const deleteSalary = (id) => apiClient.delete(`/api/v1/salaries/${id}/`);
export const getGeneralExpenses = () => apiClient.get('/api/v1/general-expenses/');
export const createGeneralExpense = (data) => apiClient.post('/api/v1/general-expenses/', data);
export const deleteGeneralExpense = (id) => apiClient.delete(`/api/v1/general-expenses/${id}/`);

// --- سایر ---
export const getNotifications = () => apiClient.get('/api/v1/notifications/');
export const markNotificationAsRead = (id) => apiClient.post(`/api/v1/notifications/${id}/mark_as_read/`);
export const markAllNotificationsAsRead = () => apiClient.post('/api/v1/notifications/mark_all_as_read/');
export const getDashboardStats = () => apiClient.get('/api/v1/dashboard-stats/');
export const getActivityLogs = () => apiClient.get('/api/v1/logs/');

// --- نظرات سناریو ---
export const getScenarioComments = (sid) => apiClient.get(`/api/v1/scenario-comments/?scenario=${sid}`);
export const createScenarioComment = (data) => apiClient.post('/api/v1/scenario-comments/', data);

// --- تیکت‌های پشتیبانی ---
export const getTickets = () => apiClient.get('/api/v1/tickets/');
export const createTicket = (data) => apiClient.post('/api/v1/tickets/', data);
export const updateTicket = (id, data) => apiClient.patch(`/api/v1/tickets/${id}/`, data);
export const getTicketMessages = (tid) => apiClient.get(`/api/v1/ticket-messages/?ticket=${tid}`);
export const sendTicketMessage = (data) => apiClient.post('/api/v1/ticket-messages/', data);

// --- ✅ سیستم چت و گفتگو (Chat System) ---

export const getChatRooms = () => {
  return apiClient.get('/api/v1/chat-rooms/');
};

export const getChatMessages = (roomId) => {
  return apiClient.get(`/api/v1/chat-messages/?room=${roomId}`);
};

export const sendChatMessage = (formData) => {
  // ارسال پیام (متن یا فایل)
  return apiClient.post('/api/v1/chat-messages/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
  });
};


export default apiClient;