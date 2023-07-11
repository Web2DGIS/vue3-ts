import type { Component } from 'vue'
import type { RouteMeta, RouteRecordRaw } from 'vue-router'

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-expect-error
export interface AppRouteRecordRaw extends Omit<RouteRecordRaw, 'meta'> {
  name: string
  meta: RouteMeta
  component?: Component | string
  components?: Component
  props?: Recordable
  fullPath?: string
}
