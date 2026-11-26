import * as z from 'zod'

export const ObservedToolTiming = z
  .object({ startedAt: z.number().nonnegative(), endedAt: z.number().nonnegative().optional() })
  .optional()

export const ToolMetadata = {
  observedTiming: ObservedToolTiming,
  mcpIdentity: z.object({ server: z.string(), tool: z.string() }).optional(),
  exitCode: z.number().int().optional(),
  durationMs: z.number().nonnegative().optional(),
  webSearchResults: z.array(z.object({ title: z.string(), url: z.string() })).optional(),
  outputImagePaths: z.array(z.string()).optional()
}
