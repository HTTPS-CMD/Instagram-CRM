// src/api.js
import axios from 'axios';

const API_URL = import.meta.env.DEV ? 'http://127.0.0.1:8000' : '';

const apiClient = axios.create({
  baseURL: API_URL,
});

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

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error("No refresh token available");

        const baseURL = API_URL || window.location.origin;
        const response = await axios.post(`${baseURL}/api/v1/token/refresh/`, {
          refresh: refreshToken
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const loginUser = (username, password) => apiClient.post('/api/v1/token/', { username, password });

// Projects
export const getProjects = () => apiClient.get('/api/v1/projects/');
export const getProjectDetails = (id) => apiClient.get(`/api/v1/projects/${id}/`);
export const createProject = (data) => apiClient.post('/api/v1/projects/', data);
export const updateProject = (id, data) => apiClient.patch(`/api/v1/projects/${id}/`, data);
export const deleteProject = (id) => apiClient.delete(`/api/v1/projects/${id}/`);

// Scenarios
export const getScenarios = (id) => apiClient.get(`/api/v1/projects/${id}/scenarios/`);
export const createScenario = (id, data) => apiClient.post(`/api/v1/projects/${id}/scenarios/`, data);
export const updateScenario = (sId, data, pId) => apiClient.patch(`/api/v1/projects/${pId}/scenarios/${sId}/`, data);
export const deleteScenario = (sId, pId) => apiClient.delete(`/api/v1/projects/${pId}/scenarios/${sId}/`);

// Calendar
export const getCalendarEvents = (id) => apiClient.get(`/api/v1/projects/${id}/calendar-events/`);
export const createCalendarEvent = (id, data) => apiClient.post(`/api/v1/projects/${id}/calendar-events/`, data);
export const deleteCalendarEvent = (pId, eId) => apiClient.delete(`/api/v1/projects/${pId}/calendar-events/${eId}/`);
export const getAllCalendarEvents = () => apiClient.get('/api/v1/all-events/');
export const createGlobalEvent = (data) => apiClient.post('/api/v1/all-events/', data);
export const deleteGlobalEvent = (id) => apiClient.delete(`/api/v1/all-events/${id}/`);

// Reports
export const getWeeklyReports = (id) => apiClient.get(`/api/v1/projects/${id}/weekly-reports/`);
export const updateMonthlyReport = (id, content) => apiClient.patch(`/api/v1/projects/${id}/`, { monthly_report_text: content });
export const updateOrCreateWeeklyReport = (pId, week, rId, content) => {
    if (rId) return apiClient.patch(`/api/v1/projects/${pId}/weekly-reports/${rId}/`, { report_text: content });
    return apiClient.post(`/api/v1/projects/${pId}/weekly-reports/`, { week_number: week, report_text: content });
};

// Files
export const getProjectFiles = (id) => apiClient.get(`/api/v1/projects/${id}/files/`);
export const uploadProjectFile = (id, data) => apiClient.post(`/api/v1/projects/${id}/files/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteProjectFile = (pId, fId) => apiClient.delete(`/api/v1/projects/${pId}/files/${fId}/`);

// Users
export const getUsers = () => apiClient.get('/api/v1/users/');
export const getClients = () => apiClient.get('/api/v1/users/?role=client');
export const getUsersByRole = (role) => apiClient.get(`/api/v1/users/?role=${role}`);
export const createUser = (data) => apiClient.post('/api/v1/users/', data);
export const updateUser = (id, data) => apiClient.patch(`/api/v1/users/${id}/`, data);
export const deleteUser = (id) => apiClient.delete(`/api/v1/users/${id}/`);
export const getUserProfile = () => apiClient.get('/api/v1/users/profile/');
export const updateUserProfile = (data) => apiClient.patch('/api/v1/users/profile/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const changePassword = (data) => apiClient.post('/api/v1/users/change-password/', data);

// Financials (Project)
export const getProjectPayments = (id) => apiClient.get(`/api/v1/projects/${id}/payments/`);
export const createProjectPayment = (id, data) => apiClient.post(`/api/v1/projects/${id}/payments/`, data);
export const deleteProjectPayment = (pId, payId) => apiClient.delete(`/api/v1/projects/${pId}/payments/${payId}/`);
export const getProjectExpenses = (id) => apiClient.get(`/api/v1/projects/${id}/expenses/`);
export const createProjectExpense = (id, data) => apiClient.post(`/api/v1/projects/${id}/expenses/`, data);
export const deleteProjectExpense = (pId, exId) => apiClient.delete(`/api/v1/projects/${pId}/expenses/${exId}/`);
export const exportProjectFinancials = (id) => apiClient.get(`/api/v1/projects/${id}/export-financials/`, { responseType: 'blob' });

// Financials (Agency)
export const getSalaries = () => apiClient.get('/api/v1/salaries/');
export const createSalary = (data) => apiClient.post('/api/v1/salaries/', data);
export const deleteSalary = (id) => apiClient.delete(`/api/v1/salaries/${id}/`);
export const getGeneralExpenses = () => apiClient.get('/api/v1/general-expenses/');
export const createGeneralExpense = (data) => apiClient.post('/api/v1/general-expenses/', data);
export const deleteGeneralExpense = (id) => apiClient.delete(`/api/v1/general-expenses/${id}/`);

// Notifications & Logs
export const getNotifications = () => apiClient.get('/api/v1/notifications/');
export const markNotificationRead = (id) => apiClient.post(`/api/v1/notifications/${id}/read/`);
export const markAllNotificationsRead = () => apiClient.post('/api/v1/notifications/read_all/');
export const getDashboardStats = () => apiClient.get('/api/v1/dashboard-stats/');
export const getActivityLogs = () => apiClient.get('/api/v1/logs/');

// Comments
export const getScenarioComments = (sid) => apiClient.get(`/api/v1/scenario-comments/?scenario=${sid}`);
export const createScenarioComment = (data) => apiClient.post('/api/v1/scenario-comments/', data);

// Chat
export const getChatRooms = () => apiClient.get('/api/v1/chat-rooms/');
export const getChatMessages = (roomId) => apiClient.get(`/api/v1/chat-messages/?room=${roomId}`);
export const sendChatMessage = (formData) => apiClient.post('/api/v1/chat-messages/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// AI
export const analyzeProjectAI = (projectId) => apiClient.post(`/api/v1/projects/${projectId}/ai-analysis/`);
export const generateScenarioAI = (projectId, data) => apiClient.post(`/api/v1/projects/${projectId}/generate-scenario/`, data);
export const generateTargetAudienceAI = (topic) => apiClient.post('/api/v1/generate-audience-ai/', { topic });

// Settings
export const getPackages = () => apiClient.get('/api/v1/packages/');
export const createPackage = (data) => apiClient.post('/api/v1/packages/', data);
export const updatePackage = (id, data) => apiClient.patch(`/api/v1/packages/${id}/`, data);
export const deletePackage = (id) => apiClient.delete(`/api/v1/packages/${id}/`);

export const getPaymentMethods = () => apiClient.get('/api/v1/payment-methods/');
export const createPaymentMethod = (data) => apiClient.post('/api/v1/payment-methods/', data);
export const updatePaymentMethod = (id, data) => apiClient.patch(`/api/v1/payment-methods/${id}/`, data);
export const deletePaymentMethod = (id) => apiClient.delete(`/api/v1/payment-methods/${id}/`);

export const getAgencyInfo = () => apiClient.get('/api/v1/agency-info/');
export const updateAgencyInfo = (id, data) => apiClient.patch(`/api/v1/agency-info/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const createAgencyInfo = (data) => apiClient.post('/api/v1/agency-info/', data, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getExtraServices = () => apiClient.get('/api/v1/extra-services/');
export const createServiceRequest = (data) => apiClient.post('/api/v1/service-requests/', data);

// Trash
export const getTrashedProjects = () => apiClient.get('/api/v1/projects/trash/');
export const restoreProject = (id) => apiClient.post(`/api/v1/projects/${id}/restore/`);
export const hardDeleteProject = (id) => apiClient.delete(`/api/v1/projects/${id}/hard_delete/`);
export const getTrashedUsers = () => apiClient.get('/api/v1/users/trash/');
export const restoreUser = (id) => apiClient.post(`/api/v1/users/${id}/restore/`);
export const hardDeleteUser = (id) => apiClient.delete(`/api/v1/users/${id}/hard_delete/`);

export const getAgencyFiles = () => apiClient.get('/api/v1/agency-files/');
export const createAgencyFile = (data) => apiClient.post('/api/v1/agency-files/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteAgencyFile = (id) => apiClient.delete(`/api/v1/agency-files/${id}/`);

export const getTargetAudiences = () => apiClient.get('/api/v1/target-audiences/');
export const createTargetAudience = (data) => apiClient.post('/api/v1/target-audiences/', data);
export const updateTargetAudience = (id, data) => apiClient.patch(`/api/v1/target-audiences/${id}/`, data);
export const deleteTargetAudience = (id) => apiClient.delete(`/api/v1/target-audiences/${id}/`);

// Leads Pipeline
export const getLeads = () => apiClient.get('/api/v1/leads/');
export const createLead = (data) => apiClient.post('/api/v1/leads/', data);
export const updateLead = (id, data) => apiClient.patch(`/api/v1/leads/${id}/`, data);
export const deleteLead = (id) => apiClient.delete(`/api/v1/leads/${id}/`);

// Tickets
export const getTickets = () => apiClient.get('/api/v1/tickets/');
export const createTicket = (data) => apiClient.post('/api/v1/tickets/', data);
export const updateTicket = (id, data) => apiClient.patch(`/api/v1/tickets/${id}/`, data);
export const getTicketMessages = (tid) => apiClient.get(`/api/v1/ticket-messages/?ticket=${tid}`);
export const sendTicketMessage = (data) => apiClient.post('/api/v1/ticket-messages/', data);

// Tasks (Project Specific)
export const getTasks = (projectId) => apiClient.get(`/api/v1/projects/${projectId}/tasks/`);
export const createTask = (projectId, data) => apiClient.post(`/api/v1/projects/${projectId}/tasks/`, data);
export const updateTask = (projectId, taskId, data) => apiClient.patch(`/api/v1/projects/${projectId}/tasks/${taskId}/`, data);
export const deleteTask = (projectId, taskId) => apiClient.delete(`/api/v1/projects/${projectId}/tasks/${taskId}/`);

// ✅ Tasks (Personnel/Global Dashboard) - توابع جدید برای رفع ارور
export const getAllTasks = () => apiClient.get('/api/v1/tasks/');
export const createPersonnelTask = (data) => apiClient.post('/api/v1/tasks/', data);
export const updatePersonnelTask = (id, data) => apiClient.patch(`/api/v1/tasks/${id}/`, data);
export const deletePersonnelTask = (id) => apiClient.delete(`/api/v1/tasks/${id}/`);

// command search
export const globalSearch = (q) => apiClient.get(`/api/v1/global-search/?q=${q}`);

// comment N
export const getFileComments = (fileId) => apiClient.get(`/api/v1/global-file-comments/?file_id=${fileId}`);
export const createFileComment = (data) => apiClient.post(`/api/v1/global-file-comments/`, data);
export const deleteFileComment = (id) => apiClient.delete(`/api/v1/global-file-comments/${id}/`);


// Sticky Notes
export const getStickyNotes = () => apiClient.get('/api/v1/sticky-notes/');
export const createStickyNote = (data) => apiClient.post('/api/v1/sticky-notes/', data);
export const updateStickyNote = (id, data) => apiClient.patch(`/api/v1/sticky-notes/${id}/`, data);
export const deleteStickyNote = (id) => apiClient.delete(`/api/v1/sticky-notes/${id}/`);


// Time Tracking
export const startTimeLog = (taskId) => apiClient.post('/api/v1/time-logs/start_timer/', { task_id: taskId });
export const stopTimeLog = (description) => apiClient.post('/api/v1/time-logs/stop_timer/', { description });
export const getCurrentTimeLog = () => apiClient.get('/api/v1/time-logs/current/');
export const getTaskTimeLogs = (taskId) => apiClient.get(`/api/v1/time-logs/?task_id=${taskId}`);

// Shared Links
export const generateSharedLink = (fileId) => apiClient.post('/api/v1/shared-links/generate/', { file_id: fileId });
export const getPublicFile = (token) => apiClient.get(`/api/v1/public/share/${token}/`);
export const postPublicComment = (token, data) => apiClient.post(`/api/v1/public/share/${token}/`, data);


// Widget Config
export const getDashboardConfig = () => apiClient.get('/api/v1/dashboard-config/');
export const saveDashboardConfig = (widgets) => apiClient.post('/api/v1/dashboard-config/', { widgets });

export default apiClient;