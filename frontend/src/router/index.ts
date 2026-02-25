import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import EmailCreateView from '../views/EmailCreateView.vue';
import EmailListView from '../views/EmailListView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/emails/new', name: 'email-create', component: EmailCreateView, meta: { requiresAuth: true } },
    { path: '/emails', name: 'email-list', component: EmailListView, meta: { requiresAuth: true } }
  ]
});

router.beforeEach((to) => {
  const token = localStorage.getItem('accessToken');
  if (to.meta.requiresAuth && !token) {
    return { name: 'login' };
  }
  if (to.name === 'login' && token) {
    return { name: 'dashboard' };
  }
  return true;
});
