import { withInstall } from '/@/util'
import markDown from './src/Markdown.vue'
import markDownViewer from './src/MarkdownViewer.vue'

export const MarkDown = withInstall(markDown)
export const MarkDownViewer = withInstall(markDownViewer)

export * from './src/typing'
