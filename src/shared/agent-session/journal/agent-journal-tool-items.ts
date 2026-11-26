import type {
  NativeChatToolMetadata,
  NativeChatToolTiming
} from '../../native-chat/tools/native-chat-tool-identity'
import type { AgentJournalBoundedPayload } from './agent-session-journal-types'

export type AgentJournalToolCallState = 'running' | 'completed' | 'failed'

/** How a call that did not finish on its own ended, finer than its `failed` state. Persisted and
 *  open for growth: a reader that cannot place a value reads `state`. `unverifiable` is a call its
 *  session's end closed when nothing proved that end, so a later proof naming its owner finds it
 *  and revises it to `interrupted`, as it does the turn. */
export const AGENT_JOURNAL_TOOL_CALL_ENDINGS = ['interrupted', 'unverifiable'] as const
export type AgentJournalToolCallEnding = (typeof AGENT_JOURNAL_TOOL_CALL_ENDINGS)[number]

export type AgentJournalToolCallItem = NativeChatToolMetadata & {
  kind: 'tool-call'
  name: string
  input: unknown
  /** Provider-supplied identity within this item stream; optional for mixed-version peers. */
  callId?: string
  state: AgentJournalToolCallState
  /** Only beside `state: 'failed'`, which builds that predate it read as they always did. Read
   *  both through `agentJournalToolCallLifecycle`. */
  endedAs?: AgentJournalToolCallEnding
  output?: AgentJournalBoundedPayload
}

export type AgentJournalDiffItem = {
  kind: 'diff'
  observedTiming?: NativeChatToolTiming
  path: string
  /** Every changed file when `path` is a count ("2 files"); absent from older hosts. */
  paths?: string[]
  patch: AgentJournalBoundedPayload
}
