import { createRouter, createWebHashHistory } from 'vue-router';
import { getSession } from '@/utils/session';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/doctor/dashboard',
      component: () => import('@/views/DoctorDashboardView.vue'),
    },
    {
      path: '/doctor/consultation/:appointmentId',
      component: () => import('@/views/DoctorConsultationView.vue'),
    },
    {
      path: '/patient/select-doctor',
      component: () => import('@/views/PatientSelectDoctorView.vue'),
    },
    {
      path: '/patient/waiting/:appointmentId',
      component: () => import('@/views/PatientWaitingView.vue'),
    },
    {
      path: '/patient/consultation/:appointmentId',
      component: () => import('@/views/PatientConsultationView.vue'),
    },
    {
      path: '/patient/consultation-finished/:appointmentId',
      component: () => import('@/views/PatientConsultationFinishedView.vue'),
    },
  ],
});

router.beforeEach(to => {
  if (to.path === '/login') {
    return true;
  }

  const session = getSession();
  if (!session) {
    return '/login';
  }

  if (to.path.startsWith('/doctor') && session.role !== 'doctor') {
    return '/login';
  }

  if (to.path.startsWith('/patient') && session.role !== 'patient') {
    return '/login';
  }

  return true;
});

export default router;
