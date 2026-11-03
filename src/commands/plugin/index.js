import { addPublish } from '@/commands/plugin/publish.js'
import { addRelease } from '@/commands/plugin/release.js'

/** Adds `plugin`, the commands for the plugins of Steward. */
export function addPlugin(program) {
  const plugin = program.command('plugin').description('Work with a plugin of Steward')

  addPublish(plugin)
  addRelease(plugin)
}
