import { expect, it } from 'vitest'
import { agentJournalItemKey } from '../../../../shared/agent-session/journal/agent-session-journal-item-key'
import type {
  AgentJournalStatusItem,
  AgentJournalToolCallItem
} from '../../../../shared/agent-session/journal/agent-session-journal-types'
import { isAdmissibleAgentJournalItemBody } from '../../../../shared/agent-session/journal/agent-session-journal-schemas'
import { structuredAgentSessionToolCallBlock } from '../../../../shared/agent-session/view/messages/structured-agent-session-tool-call-block'
import { nativeChatToolRunTiming } from '../../../../shared/native-chat/tools/native-chat-tool-run-timing'
import { CODEX_JOURNAL_ADMITTED } from './codex-structured-journal-contracts'
import { createCodexJournalTranslator } from './codex-structured-journal-translation'
import { CodexTurnFailures } from './codex-turn-failures'

it('keeps a reply whose item id a provider reuses in a later turn as its own row', () => {
  const rows = new Map<string, unknown>()
  const translator = createCodexJournalTranslator({
    sink: {
      appendItem: (identity, body) => rows.set(agentJournalItemKey(identity), body),
      appendTombstone: () => {},
      publish: () => {}
    }
  })
  const send = (method: string, params: Record<string, unknown>): void => {
    translator.handle({ type: 'notification', sessionId: 's', threadId: 't', method, params })
  }
  for (const [turnId, text] of [
    ['turn-a', 'first answer'],
    ['turn-b', 'second answer']
  ]) {
    const item = { type: 'agentMessage', id: 'msg_0', text: '' }
    const user = { type: 'userMessage', id: `user-${turnId}`, content: [] }
    send('turn/started', { threadId: 't', turn: { id: turnId } })
    send('item/completed', { threadId: 't', turnId, item: user })
    send('item/started', { threadId: 't', turnId, item })
    send('item/agentMessage/delta', { threadId: 't', turnId, itemId: 'msg_0', delta: text })
    send('item/completed', { threadId: 't', turnId, item: { ...item, text } })
    send('turn/completed', { threadId: 't', turn: { id: turnId, status: 'completed' } })
  }
  translator.flush()

  const bodyJson = (key: string): string | undefined => JSON.stringify(rows.get(key))
  // Ordinal 1 follows the user echo, matching how history import numbers each turn.
  expect([...rows.keys()]).toEqual(['codex:t:turn-a:1', 'codex:t:turn-b:1'])
  expect(bodyJson('codex:t:turn-a:1')).toContain('first answer')
  expect(bodyJson('codex:t:turn-b:1')).toContain('second answer')
})

it('journals Codex throttles as provider unavailability and quota errors as usage limits', () => {
  const rows: AgentJournalStatusItem[] = []
  const failures = new CodexTurnFailures({
    activeTurn: () => null,
    append: (_threadId, _payload, frame) => {
      rows.push(frame.body)
      return CODEX_JOURNAL_ADMITTED
    }
  })
  failures.observe('notification:account/rateLimits/updated', {
    rateLimits: {
      limitId: 'codex',
      secondary: { usedPercent: 78, windowDurationMins: 10080, resetsAt: null }
    }
  })

  const errors = [
    {
      message: 'exceeded retry limit, last status: 429 Too Many Requests',
      codexErrorInfo: { responseTooManyFailedAttempts: { httpStatusCode: 429 } }
    },
    { message: 'Slow down', codexErrorInfo: 'rateLimitExceeded' },
    { message: 'You’ve hit your usage limit.', codexErrorInfo: 'usageLimitExceeded' }
  ]
  const threadId = 'thread'
  for (const [index, error] of errors.entries()) {
    const payload = {
      threadId,
      turnId: `turn-${index}`,
      willRetry: false,
      error: { ...error, additionalDetails: null }
    }
    failures.appendTerminal('notification:error', payload, payload, threadId)
  }

  expect(rows.map((row) => row.failure?.kind)).toEqual([
    'providerUnavailable',
    'providerUnavailable',
    'usageLimitReached'
  ])
})

it('round-trips observed tool timings and measures overlapping calls by their span', () => {
  const rows = new Map<string, AgentJournalToolCallItem>()
  const translator = createCodexJournalTranslator({
    sink: {
      appendItem: (identity, body) => {
        if (body.kind === 'tool-call') {
          const restored: unknown = JSON.parse(JSON.stringify(body))
          if (isAdmissibleAgentJournalItemBody(restored) && restored.kind === 'tool-call') {
            rows.set(agentJournalItemKey(identity), restored)
          }
        }
      },
      appendTombstone: () => {},
      publish: () => {}
    }
  })
  const send = (at: number, method: string, item: Record<string, unknown>): void => {
    translator.handle({
      type: 'notification',
      sessionId: 's',
      threadId: 't',
      method,
      observedAt: at,
      params: { threadId: 't', turnId: 'turn-a', item }
    })
  }
  const call = (id: string, status: string) => ({
    type: 'commandExecution',
    id,
    command: 'pwd',
    status
  })
  send(1000, 'item/started', call('first', 'inProgress'))
  send(3000, 'item/started', call('second', 'inProgress'))
  send(6000, 'item/completed', call('first', 'completed'))
  send(8000, 'item/completed', call('second', 'completed'))
  send(9000, 'item/completed', call('missing-start', 'completed'))

  const blocks = [...rows].map(([id, row]) => structuredAgentSessionToolCallBlock(row, id))
  expect(blocks.map((block) => block.observedTiming)).toEqual([
    { startedAt: 1000, endedAt: 6000 },
    { startedAt: 3000, endedAt: 8000 },
    undefined
  ])
  expect(nativeChatToolRunTiming(blocks.slice(0, 2))).toEqual({ startedAt: 1000, endedAt: 8000 })
  expect(nativeChatToolRunTiming(blocks)).toBeUndefined()
})
