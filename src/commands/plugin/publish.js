import * as core from '@actions/core'

import { zipDocs } from '@/lib/docs.js'
import { inputs } from '@/lib/inputs.js'
import { Registry } from '@/lib/registry.js'

/** What the job was started by must be a push of the tag `v<version>`: the registry checks it against the token too. */
function versionFromTag() {
  const { GITHUB_REF_TYPE: type, GITHUB_REF_NAME: name = '' } = process.env

  if (type !== 'tag' || !name.startsWith('v')) {
    throw new Error(`Publish from a tag named v<version>, not from ${process.env.GITHUB_REF}`)
  }

  return name.slice(1)
}

async function publish() {
  const { 'plugin-id': pluginId, docs, registry: address, audience } = inputs()

  if (!pluginId) {
    throw new Error('The plugin-id input is required')
  }

  const version = versionFromTag()
  const zip = await zipDocs(docs)

  core.info(`Zipped ${zip.pages} pages of ${version}: ${zip.size} bytes`)

  const registry = new Registry(address, pluginId, await core.getIDToken(audience))
  const announcement = { version, size: zip.size, sha256: zip.sha256 }

  const { url } = await registry.begin(announcement)
  await registry.upload(url, zip.content)

  // The worker processes the zip after this job is done: the status is where its outcome is read.
  const status = registry.status(await registry.finish(announcement))

  core.info(`Sent ${version} to the registry. Status: ${status}`)
  await core.summary.addRaw(`Sent ${version} to the registry. [Status](${status})`).write()
}

/** Adds `publish` to `plugin`. It reads the inputs of the action. */
export function addPublish(plugin) {
  plugin
    .command('publish')
    .description('Zip the docs of a plugin and send them to the registry with the OIDC token of the job')
    .action(publish)
}
