import * as core from '@actions/core'
import { Command } from 'commander'

import { addPlugin } from '@/commands/plugin/index.js'

const program = new Command('steward-actions').description('The actions of Steward, which also run from a terminal')

addPlugin(program)

program.parseAsync().catch((error) => core.setFailed(error))
