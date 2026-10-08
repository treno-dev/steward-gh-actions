import { HttpClient } from '@actions/http-client'

/** The calls that publish a plugin to the registry, with the OIDC token of the job. */
export class Registry {
  constructor(address, pluginId, token) {
    this.plugin = `${address.replace(/\/+$/, '')}/plugins/${pluginId}`
    this.client = new HttpClient('steward-gh-actions', [], {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
  }

  /** Announces the zip of a version and is given the URL to upload it to. */
  async begin(announcement) {
    return this.#send('POST', `${this.plugin}/uploads`, JSON.stringify(announcement))
  }

  /** Uploads the zip to the URL that begin gave, which is not the registry and takes no token. */
  async upload(url, content) {
    const response = await new HttpClient('steward-gh-actions').put(url, content)

    await this.#check(response, 'Uploading the zip')
  }

  /** Says the zip is uploaded, which has the registry process it. Returns the publication. */
  async finish(announcement) {
    return this.#send('POST', `${this.plugin}/versions`, JSON.stringify(announcement))
  }

  /** The address where the outcome of the publication is read. */
  status(publication) {
    return `${this.plugin}/publications/${publication.ulid}`
  }

  async #send(method, url, body) {
    const response = await this.client.request(method, url, body)

    await this.#check(response, `${method} ${url}`)

    return JSON.parse(await response.readBody())
  }

  async #check(response, what) {
    const status = response.message.statusCode

    if (status >= 200 && status < 300) {
      return
    }

    throw new Error(`${what} failed with ${status}: ${(await response.readBody()).trim()}`)
  }
}
