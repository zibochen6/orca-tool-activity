import { app } from 'electron'

export function isToolActivityBuild(): boolean {
  return app?.isPackaged === true && /-activity\.[1-9]\d*$/.test(app.getVersion())
}
