import { withInstall } from '/@/util'
import appProvider from './src/AppProvider.vue'

export { useAppProviderContext } from './src/useAppContext'

export const AppProvider = withInstall(appProvider)
