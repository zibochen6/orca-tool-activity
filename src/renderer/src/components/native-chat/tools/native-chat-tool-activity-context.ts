import { createContext, useContext, useSyncExternalStore } from 'react'
import { formatToolDuration } from '../../../../../shared/native-chat/tools/native-chat-tool-identity'
import type { NativeChatToolTiming } from '../../../../../shared/native-chat/tools/native-chat-tool-identity'
import { useTranslate } from '@/i18n/use-translate'
import { installWindowVisibilityInterval } from '@/lib/window-activity/window-visibility-interval'

export function createNativeChatToolClock() {
  let now = 0
  let stopClock: (() => void) | undefined
  const listeners = new Set<() => void>()
  const tick = (): void => {
    now = Date.now()
    listeners.forEach((listener) => listener())
  }
  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      if (!stopClock) {
        now = Date.now()
        stopClock = installWindowVisibilityInterval({ run: tick, intervalMs: 1000 })
      }
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0) {
          stopClock?.()
          stopClock = undefined
          now = 0
        }
      }
    },
    snapshot: () => now
  }
}

export const NativeChatToolActivityContext = createContext<{
  enabled: boolean
  clock: ReturnType<typeof createNativeChatToolClock> | null
}>({ enabled: false, clock: null })

const subscribeIdle = (): (() => void) => () => {}
const idleSnapshot = (): number => 0

export function useNativeChatToolDuration(
  timing: NativeChatToolTiming | undefined,
  running = false
): string | null {
  const t = useTranslate()
  const { clock } = useContext(NativeChatToolActivityContext)
  const active = running && timing !== undefined && timing.endedAt === undefined ? clock : null
  const now = useSyncExternalStore(
    active?.subscribe ?? subscribeIdle,
    active?.snapshot ?? idleSnapshot
  )
  if (!timing) {
    return null
  }
  const end = timing.endedAt ?? (running ? Math.max(now, timing.startedAt) : undefined)
  return end === undefined
    ? null
    : formatToolDuration(end - timing.startedAt, (value0) =>
        t('components.native-chat.tool.milliseconds', '{{value0}}ms', { value0 })
      )
}
