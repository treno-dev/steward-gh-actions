import { addPublish } from '@/commands/plugin/publish.js'

/** Adds `plugin`, the commands for the plugins of the registry. */
export function addPlugin(program) {
  const plugin = program.command('plugin').description('Work with a plugin of the registry')

  addPublish(plugin)
}
