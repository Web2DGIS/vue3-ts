import { LAYOUT, MAP_ROUTERR } from '../constant'
import type { AppRouteRecordRaw } from '../types'
import { PAGE_NOT_FOUND_ROUTE } from './basic'

export const REDIRECT_ROUTE: AppRouteRecordRaw = {
  path: '/',
  component: LAYOUT,
  redirect: MAP_ROUTERR,
  name: 'Root',
  meta: {
    title: 'Root',
  },
  children: [
    {
      path: MAP_ROUTERR,
      name: 'Map',
      component: () => import('/@/views/map/index.vue'),
      meta: {
        title: '地图',
      },
    },
    {
      path: '/d3',
      name: 'd3',
      component: () => import('/@/views/d3/index.vue'),
      meta: {
        title: 'd3',
      },
    },
    {
      path: '/unoCss',
      name: 'unoCss',
      component: () => import('/@/views/unoCss/index.vue'),
      meta: {
        title: 'unoCss',
      },
    },
    {
      path: '/andDesign',
      name: 'andDesign',
      component: () => import('/@/views/andDesign/index.vue'),
      meta: {
        title: 'andDesign',
      },
    },
    {
      path: '/markdown',
      name: 'markdown',
      component: () => import('/@/views/markdown/index.vue'),
      meta: {
        title: 'markdown',
      },
    },
  ],
}

export const basicRoutes = [
  REDIRECT_ROUTE,
  PAGE_NOT_FOUND_ROUTE,
]
