// src/api.js
import axios from 'axios';

const API_URL = '';

const apiClient = axios.create({
  baseURL: API_URL,
});

// ۱. اینترسپتور درخواست: توکن را به هدر تمام درخواست‌ها می‌چسباند
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

// ۲. ✅✅✅ اینترسپتور پاسخ: مدیریت هوشمند تمدید توکن (Refresh Token)
apiClient.interceptors.response.use(
  (response) => {
    return response; // اگر پاسخ موفق بود، کاری نکن
  },
  async (error) => {
    const originalRequest = error.config;

    // اگر خطای 401 (عدم دسترسی) گرفتیم و این اولین تلاش ماست (لوپ بی‌نهایت نشود)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            // اگر رفرش توکن هم نبود، یعنی کاربر کلا لاگ‌اوت شده
            throw new Error("No refresh token");
        }

        // درخواست به سرور برای دریافت اکسس توکن جدید
        const response = await axios.post(`${API_URL}/api/v1/token/refresh/`, {
          refresh: refreshToken
        });

        const { access } = response.data;

        // ذخیره توکن جدید در مرورگر
        localStorage.setItem('access_token', access);

        // آپدیت کردن درخواست قبلی با توکن جدید و ارسال مجدد آن
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        // اگر تمدید توکن هم شکست خورد (یعنی خیلی وقته لاگین نکردید)، کاربر رو بنداز بیرون
        console.error("Session expired:", refreshError);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // اگر خطای دیگری بود، آن را به برنامه برگردان
    return Promise.reject(error);
  }
);

// --- توابع API ---

export const loginUser = (username, password) => {
  return apiClient.post('/api/v1/token/', {
    username: username,
    password: password
  });
};

export const getProjects = () => {
  return apiClient.get('/api/v1/projects/');
};

export const getProjectDetails = (projectId) => {
  return apiClient.get(`/api/v1/projects/${projectId}/`);
};

export const createProject = (projectData) => {
  return apiClient.post('/api/v1/projects/', projectData);
};

export const updateProject = (projectId, projectData) => {
  return apiClient.patch(`/api/v1/projects/${projectId}/`, projectData);
};

export const deleteProject = (projectId) => {
  return apiClient.delete(`/api/v1/projects/${projectId}/`);
};

export const getScenarios = (projectId) => {
  return apiClient.get(`/api/v1/projects/${projectId}/scenarios/`);
};

export const createScenario = (projectId, scenarioData) => {
  return apiClient.post(`/api/v1/projects/${projectId}/scenarios/`, scenarioData);
};

export const updateScenario = (scenarioId, scenarioData, projectId) => {
  return apiClient.patch(`/api/v1/projects/${projectId}/scenarios/${scenarioId}/`, scenarioData);
};

export const deleteScenario = (scenarioId, projectId) => {
  return apiClient.delete(`/api/v1/projects/${projectId}/scenarios/${scenarioId}/`);
};

export const getCalendarEvents = (projectId) => {
  return apiClient.get(`/api/v1/projects/${projectId}/calendar-events/`);
};

export const createCalendarEvent = (projectId, eventData) => {
  return apiClient.post(`/api/v1/projects/${projectId}/calendar-events/`, eventData);
};

export const deleteCalendarEvent = (projectId, eventId) => {
  return apiClient.delete(`/api/v1/projects/${projectId}/calendar-events/${eventId}/`);
};

export const getWeeklyReports = (projectId) => {
  return apiClient.get(`/api/v1/projects/${projectId}/weekly-reports/`);
};

export const updateMonthlyReport = (projectId, content) => {
  return apiClient.patch(`/api/v1/projects/${projectId}/`, {
    monthly_report_text: content,
  });
};

export const updateOrCreateWeeklyReport = (projectId, weekNumber, reportId, content) => {
    if (reportId) {
        return apiClient.patch(`/api/v1/projects/${projectId}/weekly-reports/${reportId}/`, {
            report_text: content,
        });
    }
    return apiClient.post(`/api/v1/projects/${projectId}/weekly-reports/`, {
        week_number: weekNumber,
        report_text: content,
    });
};

export const getClients = () => {
    return apiClient.get('/api/v1/users/?role=client');
};

export const getUsersByRole = (role) => {
    return apiClient.get(`/api/v1/users/?role=${role}`);
};

// مدیریت فایل‌ها
export const getProjectFiles = (projectId) => {
  return apiClient.get(`/api/v1/projects/${projectId}/files/`);
};

export const uploadProjectFile = (projectId, formData) => {
  return apiClient.post(`/api/v1/projects/${projectId}/files/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deleteProjectFile = (projectId, fileId) => {
  return apiClient.delete(`/api/v1/projects/${projectId}/files/${fileId}/`);
};

// مدیریت کاربران
export const getUsers = () => {
  return apiClient.get('/api/v1/users/');
};

export const createUser = (userData) => {
  return apiClient.post('/api/v1/users/', userData);
};

export const updateUser = (userId, userData) => {
  return apiClient.patch(`/api/v1/users/${userId}/`, userData);
};

export const deleteUser = (userId) => {
  return apiClient.delete(`/api/v1/users/${userId}/`);
};

// مدیریت مالی پروژه
export const getProjectPayments = (projectId) => {
  return apiClient.get(`/api/v1/projects/${projectId}/payments/`);
};

export const createProjectPayment = (projectId, paymentData) => {
  return apiClient.post(`/api/v1/projects/${projectId}/payments/`, paymentData);
};

export const deleteProjectPayment = (projectId, paymentId) => {
  return apiClient.delete(`/api/v1/projects/${projectId}/payments/${paymentId}/`);
};

// هزینه‌های پروژه
export const getProjectExpenses = (projectId) => {
  return apiClient.get(`/api/v1/projects/${projectId}/expenses/`);
};

export const createProjectExpense = (projectId, expenseData) => {
  return apiClient.post(`/api/v1/projects/${projectId}/expenses/`, expenseData);
};

export const deleteProjectExpense = (projectId, expenseId) => {
  return apiClient.delete(`/api/v1/projects/${projectId}/expenses/${expenseId}/`);
};

// خروجی اکسل
export const exportProjectFinancials = (projectId) => {
  return apiClient.get(`/api/v1/projects/${projectId}/export-financials/`, {
    responseType: 'blob',
  });
};

// اعلانات
export const getNotifications = () => {
  return apiClient.get('/api/v1/notifications/');
};

export const markNotificationAsRead = (id) => {
  return apiClient.post(`/api/v1/notifications/${id}/mark_as_read/`);
};

export const markAllNotificationsAsRead = () => {
  return apiClient.post('/api/v1/notifications/mark_all_as_read/');
};

// آمار داشبورد
export const getDashboardStats = () => {
  return apiClient.get('/api/v1/dashboard-stats/');
};

// مدیریت حقوق و هزینه‌های آژانس
export const getSalaries = () => {
  return apiClient.get('/api/v1/salaries/');
};
export const createSalary = (data) => {
  return apiClient.post('/api/v1/salaries/', data);
};
export const deleteSalary = (id) => {
  return apiClient.delete(`/api/v1/salaries/${id}/`);
};

export const getGeneralExpenses = () => {
  return apiClient.get('/api/v1/general-expenses/');
};
export const createGeneralExpense = (data) => {
  return apiClient.post('/api/v1/general-expenses/', data);
};
export const deleteGeneralExpense = (id) => {
  return apiClient.delete(`/api/v1/general-expenses/${id}/`);
};
// --- ✅ سیستم نظرات سناریو (Comments) ---

export const getScenarioComments = (scenarioId) => {
  return apiClient.get(`/api/v1/scenario-comments/?scenario=${scenarioId}`);
};

export const createScenarioComment = (data) => {
  return apiClient.post('/api/v1/scenario-comments/', data);
};

export const getAllCalendarEvents = () => {
  return apiClient.get('/api/v1/all-events/');
};

export const getUserProfile = () => {
  return apiClient.get('/api/v1/users/profile/')};

// --- ✅ مدیریت پروفایل کاربری (User Profile) ---

// export const getUserProfile = () => {
//   // دریافت اطلاعات پروفایل کاربر لاگین شده
//   return apiClient.get('/api/v1/users/profile/');
// };

export const updateUserProfile = (formData) => {
  // ویرایش اطلاعات (شامل عکس)
  // چون عکس داریم، هدر Content-Type باید multipart باشد که axios خودکار هندل می‌کند
  return apiClient.patch('/api/v1/users/profile/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const changePassword = (passwordData) => {
  // تغییر رمز عبور
  return apiClient.post('/api/v1/users/change-password/', passwordData);
};

// --- ✅ سیستم تیکت پشتیبانی (Support) ---

export const getTickets = () => {
  return apiClient.get('/api/v1/tickets/');
};

export const createTicket = (data) => {
  return apiClient.post('/api/v1/tickets/', data);
};

export const updateTicket = (ticketId, data) => {
    // برای تغییر وضعیت یا بستن تیکت
  return apiClient.patch(`/api/v1/tickets/${ticketId}/`, data);
};

export const getTicketMessages = (ticketId) => {
  return apiClient.get(`/api/v1/ticket-messages/?ticket=${ticketId}`);
};

export const sendTicketMessage = (data) => {
  return apiClient.post('/api/v1/ticket-messages/', data);
};

export const getActivityLogs = () => {
  return apiClient.get('/api/v1/logs/');
};

export default apiClient;