import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import EmailCreateView from '../views/EmailCreateView.vue';
import EmailListView from '../views/EmailListView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/emails/new', name: 'email-create', component: EmailCreateView },
    { path: '/emails', name: 'email-list', component: EmailListView }
  ]
});
