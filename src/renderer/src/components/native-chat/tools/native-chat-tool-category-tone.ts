import type { NativeChatToolCategory } from '../../../../../shared/native-chat/tools/native-chat-tool-icon'

export const nativeChatToolCategoryTone: Record<NativeChatToolCategory, string> = {
  read: 'text-blue-700 dark:text-blue-300',
  listFiles: 'text-blue-700 dark:text-blue-300',
  search: 'text-violet-700 dark:text-violet-300',
  fileChange: 'text-emerald-700 dark:text-emerald-300',
  unknown: 'text-orange-700 dark:text-orange-300',
  webSearch: 'text-cyan-700 dark:text-cyan-300',
  browser: 'text-cyan-700 dark:text-cyan-300',
  mcpToolCall: 'text-pink-700 dark:text-pink-300',
  subAgentActivity: 'text-chat-foreground-faint',
  todoList: 'text-chat-foreground-faint',
  other: 'text-chat-foreground-faint'
}
