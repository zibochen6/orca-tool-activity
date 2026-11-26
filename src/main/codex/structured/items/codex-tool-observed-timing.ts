import type { AgentJournalItemBody } from '../../../../shared/agent-session/journal/agent-session-journal-types'

import {
  withJournalReasoningLifecycle,
  type JournalReasoningLifecycle
} from '../../../native-chat/agent-session-journal/item-lifecycle/journal-reasoning-row'
import type { CodexJournalItem } from './codex-structured-item-translation'

export function withCodexToolObservedTiming(
  body: AgentJournalItemBody,
  startedAt: number | undefined,
  endedAt?: number
): AgentJournalItemBody {
  if (
    (body.kind !== 'tool-call' && body.kind !== 'diff') ||
    startedAt === undefined ||
    !Number.isFinite(startedAt) ||
    startedAt < 0
  ) {
    return body
  }
  return {
    ...body,
    observedTiming: {
      startedAt,
      ...(endedAt !== undefined && Number.isFinite(endedAt) && endedAt >= startedAt
        ? { endedAt }
        : {})
    }
  }
}

export function withCodexJournalItemLifecycle(
  item: CodexJournalItem,
  state: JournalReasoningLifecycle,
  startedAt?: number,
  endedAt?: number
): CodexJournalItem {
  return item.body
    ? {
        ...item,
        body: withCodexToolObservedTiming(
          withJournalReasoningLifecycle(item.body, state),
          startedAt,
          endedAt
        )
      }
    : item
}
