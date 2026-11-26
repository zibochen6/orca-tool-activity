import { useMemo } from 'react'
import { useTranslate } from '@/i18n/use-translate'
import type { NativeChatToolCallBlock } from '../../../../../../shared/native-chat/native-chat-types'
import {
  nativeChatToolCategory,
  type NativeChatToolCategory
} from '../../../../../../shared/native-chat/tools/native-chat-tool-icon'
import { nativeChatToolRunTiming } from '../../../../../../shared/native-chat/tools/native-chat-tool-run-timing'
import { useNativeChatToolDuration } from '../native-chat-tool-activity-context'
import { nativeChatToolCategoryTone } from '../native-chat-tool-category-tone'

export function NativeChatToolRunSummary({
  calls
}: {
  calls: readonly NativeChatToolCallBlock[]
}): React.JSX.Element {
  const t = useTranslate()
  const categories = useMemo(() => {
    const counts = new Map<NativeChatToolCategory, number>()
    for (const call of calls) {
      const category = nativeChatToolCategory(call.name, call.mcpIdentity, call.input) ?? 'other'
      const group =
        category === 'listFiles' ? 'read' : category === 'browser' ? 'webSearch' : category
      counts.set(group, (counts.get(group) ?? 0) + 1)
    }
    return counts
  }, [calls])
  const timing = useMemo(() => nativeChatToolRunTiming(calls), [calls])
  const duration = useNativeChatToolDuration(timing)
  const labels: Record<NativeChatToolCategory, string> = {
    read: t('components.native-chat.tool.activityRead', 'Read'),
    search: t('components.native-chat.tool.activitySearch', 'Search'),
    fileChange: t('components.native-chat.tool.activityEdit', 'Edit'),
    unknown: t('components.native-chat.tool.activityCommand', 'Command'),
    webSearch: t('components.native-chat.tool.activityWeb', 'Web'),
    mcpToolCall: 'MCP',
    subAgentActivity: t('components.native-chat.tool.activityAgent', 'Agent'),
    todoList: t('components.native-chat.tool.activityPlan', 'Plan'),
    other: t('components.native-chat.tool.activityOther', 'Other'),
    listFiles: '',
    browser: ''
  }
  return (
    <>
      <span className="shrink-0 text-chat-foreground">
        {t('components.native-chat.tool.callCount', '{{count}} tool calls', {
          count: calls.length,
          defaultValue_one: '{{count}} tool call'
        })}
      </span>
      <span className="flex min-w-0 items-center gap-1.5 overflow-hidden text-xs text-chat-foreground-faint @max-md:hidden!">
        {[...categories].map(([category, count]) => (
          <span className="flex shrink-0 items-center gap-1" key={category}>
            <span className={nativeChatToolCategoryTone[category]} aria-hidden>
              ●
            </span>
            {labels[category]} {count}
          </span>
        ))}
      </span>
      {duration ? (
        <span className="shrink-0 text-xs tabular-nums text-chat-foreground-faint">
          {' '}
          · {duration}
        </span>
      ) : null}
    </>
  )
}
