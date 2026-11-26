import type { NativeChatToolCallBlock } from '../native-chat-types'
import type { NativeChatToolTiming } from './native-chat-tool-identity'

export function nativeChatToolRunTiming(
  calls: readonly NativeChatToolCallBlock[]
): NativeChatToolTiming | undefined {
  if (calls.length === 0) {
    return undefined
  }

  let first = Infinity
  let last = -Infinity
  for (const { observedTiming } of calls) {
    if (
      !observedTiming ||
      observedTiming.endedAt === undefined ||
      observedTiming.endedAt < observedTiming.startedAt
    ) {
      return undefined
    }
    first = Math.min(first, observedTiming.startedAt)
    last = Math.max(last, observedTiming.endedAt)
  }
  return { startedAt: first, endedAt: last }
}
