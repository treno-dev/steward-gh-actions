import { Readable } from 'node:stream'

import { HttpClient } from '@actions/http-client'
import { BearerCredentialHandler } from '@actions/http-client/lib/auth'

const USER_AGENT = 'steward-gh-actions'

/** The calls that publish a plugin to the registry, with the OIDC token of the job. */
export class Registry {
  constructor(address, pluginId, token) {
    this.plugin = `${address.replace(/\/+$/, '')}/plugins/${pluginId}`
    this.client = new HttpClient(USER_AGENT, [new BearerCredentialHandler(token)])
  }

  /** Announces the zip of a version and is given the URL to upload it to. */
  async begin(announcement) {
    return this.#post(`${this.plugin}/uploads`, announcement)
  }

  /** Uploads the zip to the URL that begin gave, which is not the registry and takes no token. */
  async upload(url, content) {
    // The URL signs the length of the zip, so it is sent as a header: a stream has none of its own.
    const response = await new HttpClient(USER_AGENT).sendStream('PUT', url, Readable.from(content), {
      'Content-Length': content.length,
    })
    const body = await response.readBody()

    if (response.message.statusCode >= 300) {
      throw new Error(`Uploading the zip failed with ${response.message.statusCode}: ${body.trim()}`)
    }
  }

  /** Says the zip is uploaded, which has the registry process it. Returns the publication. */
  async finish(announcement) {
    return this.#post(`${this.plugin}/versions`, announcement)
  }

  /** The address where the outcome of the publication is read. */
  status(publication) {
    return `${this.plugin}/publications/${publication.ulid}`
  }

  /** Posts the object as JSON. The client rejects an error response with the message of the registry. */
  async #post(url, object) {
    const response = await this.client.postJson(url, object)

    // The client resolves a missing resource with no result, where the registry means the call is wrong.
    if (response.statusCode === 404) {
      throw new Error(`${url} was not found`)
    }

    return response.result
  }
}
