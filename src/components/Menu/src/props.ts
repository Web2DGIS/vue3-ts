import type { PropType } from 'vue'

export interface Menu {
  name: string
  icon?: string
  children?: Menu[]
  orderNo?: number
}

export const basicProps = {
  items: {
    type: Array as PropType<Menu[]>,
    default: () => [],
  },
  beforeClickFn: {
    type: Function as PropType<(key: string) => Promise<boolean>>,
  },
}
