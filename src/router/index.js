import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/', component: () => import('@/pages/Base'), children: [
      {path: '', name: 'Home', component: () => import('@/pages/Home')},
      {path: '/login', name: 'Login', component: () => import('@/pages/Login')},

      {
        path: '/users/:userId', name: 'User', component: () => import('@/pages/users/User'),
        props:  ({params}) => ({userId: Number.parseInt(params.userId, 10) || 0})
      },
      {path: '/users/new', name: 'NewUser', component: () => import('@/pages/users/NewUser')},
      {path: '/users', name: 'ListUsers', component: () => import('@/pages/users/ListUsers')},

      {path: '/streaming', name: 'Streaming', component: () => import('@/pages/Streaming')},
      {path: '/proctoring', name: 'Proctoring', component: () => import('@/pages/Proctoring')},
    ]
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router