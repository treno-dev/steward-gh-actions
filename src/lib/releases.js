import { Readable } from 'node:stream'

import * as core from '@actions/core'
import { HttpClient, HttpClientError } from '@actions/http-client'
import { BearerCredentialHandler } from '@actions/http-client/lib/auth'
import pRetry from 'p-retry'

import { retrying } from '@/lib/registry.js'

const API = 'https://api.github.com'
const UPLOADS = 'https://uploads.github.com'

const HEADERS = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }

/** The releases of one repository on GitHub, which a job with `contents: write` can change with its token. */
export class Releases {
  constructor(repository, token) {
    this.repository = repository
    this.client = new HttpClient('steward-gh-actions', [new BearerCredentialHandler(token)])
  }

  /**
   * The release of the tag, which is made as a draft when there is none. A draft is not visible to anyone else, so a
   * bundle that is still being uploaded is never fetched. Drafts are not found by tag, so the releases are listed.
   */
  async draft(tag) {
    return pRetry(async () => {
      const listed = await this.#get(`${API}/repos/${this.repository}/releases?per_page=100`)
      const existing = listed.find((release) => release.tag_name === tag)

      if (existing) {
        return existing
      }

      const response = await this.client.postJson(
        `${API}/repos/${this.repository}/releases`,
        { tag_name: tag, name: tag, draft: true, generate_release_notes: true },
        HEADERS,
      )

      return response.result
    }, retrying(`Making the release of ${tag}`))
  }

  /** Puts the asset on the release, in place of one of the same name that a run before it left. */
  async upload(release, asset) {
    return pRetry(async () => {
      await this.#removeAsset(release, asset.name)

      const name = encodeURIComponent(asset.name)
      const url = `${UPLOADS}/repos/${this.repository}/releases/${release.id}/assets?name=${name}`

      // The length is sent as a header, since a stream has none of its own.
      const response = await this.client.sendStream('POST', url, Readable.from(asset.content), {
        ...HEADERS,
        'Content-Type': asset.type,
        'Content-Length': asset.content.length,
      })
      const body = await response.readBody()

      if (response.message.statusCode >= 300) {
        throw new HttpClientError(
          `Uploading ${asset.name} failed with ${response.message.statusCode}: ${body.trim()}`,
          response.message.statusCode,
        )
      }
    }, retrying(`Uploading ${asset.name}`))
  }

  /** Makes the draft public. A runner can fetch the assets of a release only once it is. */
  async publish(release) {
    return pRetry(async () => {
      await this.client.patchJson(`${API}/repos/${this.repository}/releases/${release.id}`, { draft: false }, HEADERS)
    }, retrying(`Publishing ${release.tag_name}`))
  }

  async #removeAsset(release, name) {
    const assets = await this.#get(`${API}/repos/${this.repository}/releases/${release.id}/assets?per_page=100`)

    for (const asset of assets.filter((asset) => asset.name === name)) {
      core.info(`Replacing ${name}, which an earlier run uploaded`)

      const response = await this.client.del(`${API}/repos/${this.repository}/releases/assets/${asset.id}`, HEADERS)

      await response.readBody()

      if (response.message.statusCode >= 300) {
        const status = response.message.statusCode

        throw new HttpClientError(`Removing ${name} failed with ${status}`, status)
      }
    }
  }

  async #get(url) {
    const response = await this.client.getJson(url, HEADERS)

    return response.result ?? []
  }
}
