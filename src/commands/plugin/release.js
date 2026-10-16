import * as core from '@actions/core'

import { buildBundles } from '@/lib/bundle.js'
import { inputs } from '@/lib/inputs.js'
import { Releases } from '@/lib/releases.js'
import { versionFromTag } from '@/lib/tag.js'

const REPOSITORY_PREFIX = 'steward-plugin-'

async function release() {
  const { entrypoint, token } = inputs()

  if (!token) {
    throw new Error('The token input is required')
  }

  const { tag, version } = versionFromTag()

  const repository = process.env.GITHUB_REPOSITORY ?? ''
  const [, name = ''] = repository.split('/')

  if (!name) {
    throw new Error(`GITHUB_REPOSITORY is ${JSON.stringify(repository)}, and it is not owner/name`)
  }

  core.info(`Releasing version ${version} of ${repository}`)

  const assets = await buildBundles({
    repository: name,
    name: name.startsWith(REPOSITORY_PREFIX) ? name.slice(REPOSITORY_PREFIX.length) : name,
    version,
    entrypoint,
  })

  const releases = new Releases(repository, token)
  const draft = await releases.draft(tag)

  for (const asset of assets) {
    core.info(`Uploading ${asset.name} (${asset.content.length} bytes)`)
    await releases.upload(draft, asset)
  }

  await releases.publish(draft)

  core.info(`Published ${tag} with ${assets.length} assets`)
  await core.summary.addRaw(`Released ${tag} with ${assets.map((asset) => `\`${asset.name}\``).join(', ')}.`).write()
}

/** Adds `release` to `plugin`. It reads the inputs of the action. */
export function addRelease(plugin) {
  plugin
    .command('release')
    .description('Build the bundle of a Go plugin for each platform and attach them to the GitHub release of the tag')
    .action(release)
}
