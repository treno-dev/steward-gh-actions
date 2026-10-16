import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import * as core from '@actions/core'
import AdmZip from 'adm-zip'

const run = promisify(execFile)

/** The platforms a bundle is built for, named as Go names them. A runner fetches the one of its own platform. */
export const platforms = [
  { os: 'linux', arch: 'amd64' },
  { os: 'linux', arch: 'arm64' },
  { os: 'darwin', arch: 'amd64' },
  { os: 'darwin', arch: 'arm64' },
  { os: 'windows', arch: 'amd64' },
]

// Unix permissions go in the high half of the attributes of a zip entry: rwxr-xr-x for the executable.
const EXECUTABLE = 0o755 << 16

/** Compiles the plugin in the current folder for one platform into the file. The plugin must not need cgo to be built. */
async function compile({ os, arch }, file) {
  const env = { ...process.env, CGO_ENABLED: '0', GOOS: os, GOARCH: arch }

  await run('go', ['build', '-trimpath', '-ldflags', '-s -w', '-o', file, '.'], { env })
}

/** The bundle of a platform (ADR 003): the executable and `steward.json`, which says what the plugin is and how to start it. */
async function bundle(platform, { name, version, entrypoint }) {
  const executable = platform.os === 'windows' ? `${entrypoint}.exe` : entrypoint
  const scratch = await mkdtemp(join(tmpdir(), 'steward-bundle-'))

  try {
    const file = join(scratch, executable)

    await compile(platform, file)

    const manifest = { name, version, protoVersion: 1, runtime: 'binary', entrypoint: executable }

    const zip = new AdmZip()

    zip.addFile('steward.json', Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`))
    zip.addFile(executable, await readFile(file), '', EXECUTABLE)

    return zip.toBuffer()
  } finally {
    await rm(scratch, { recursive: true, force: true })
  }
}

/**
 * Builds the bundle of each platform from the plugin in the current folder, and the file of their checksums. Returns the
 * assets of the release: each has a name, its content and its type. The bundles are named `<repository>_<os>_<arch>.zip`.
 */
export async function buildBundles({ repository, name, version, entrypoint }) {
  const assets = []

  for (const platform of platforms) {
    core.info(`Building ${platform.os}/${platform.arch}`)

    const content = await bundle(platform, { name, version, entrypoint })

    assets.push({ name: `${repository}_${platform.os}_${platform.arch}.zip`, content, type: 'application/zip' })
  }

  const sums = assets.map(({ name, content }) => `${createHash('sha256').update(content).digest('hex')}  ${name}\n`)

  assets.push({ name: 'SHA256SUMS', content: Buffer.from(sums.join('')), type: 'text/plain' })

  return assets
}
