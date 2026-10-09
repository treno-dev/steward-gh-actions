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

  core.info(`Publishing version ${version} of plugin ${pluginId} to ${address}`)

  const zip = await zipDocs(docs)

  core.info(`Zipped ${zip.pages} pages from ${docs}: ${zip.size} bytes`)

  core.info(`Asking GitHub for an OIDC token for ${audience}`)

  const registry = new Registry(address, pluginId, await core.getIDToken(audience))
  const announcement = { version, size: zip.size }

  core.info('Announcing the zip to the registry')

  const begun = await registry.begin(announcement)

  // The registry knows the commit of the job from its token. A version that it has published from this commit is
  // published again by a re-run, which is no error and sends nothing. Another commit is refused by the registry.
  if (begun.published) {
    const status = registry.status(begun.publication)

    core.info(`Version ${version} is published already from this commit, so there is nothing to send. Status: ${status}`)
    await core.summary.addRaw(`Version ${version} is published already from this commit. [Status](${status})`).write()

    return
  }

  core.info('The registry accepted the announcement and gave an upload URL. Uploading the zip')

  await registry.upload(begun.url, zip.content)

  core.info('Uploaded. Asking the registry to process the zip')

  // The worker processes the zip after this job is done: the status is where its outcome is read.
  const publication = await registry.finish(announcement)
  const status = registry.status(publication)

  core.info(`The registry queued publication ${publication.ulid} (${publication.state}). Status: ${status}`)
  await core.summary.addRaw(`Sent ${version} to the registry. [Status](${status})`).write()
}

/** Adds `publish` to `plugin`. It reads the inputs of the action. */
export function addPublish(plugin) {
  plugin
    .command('publish')
    .description('Zip the docs of a plugin and send them to the registry with the OIDC token of the job')
    .action(publish)
}
