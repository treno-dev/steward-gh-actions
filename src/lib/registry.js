import { Readable } from 'node:stream'

import * as core from '@actions/core'
import { HttpClient, HttpClientError } from '@actions/http-client'
import { BearerCredentialHandler } from '@actions/http-client/lib/auth'
import pRetry from 'p-retry'

const USER_AGENT = 'steward-gh-actions'

// What passes by itself: a server or a proxy that is busy or restarting, a rate limit, and a connection that dropped.
// Any other answer is the registry's decision, such as 401, 403, 409 or 422, and calling again does not change it.
const TRANSIENT_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504])
const TRANSIENT_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EAI_AGAIN',
  'ENOTFOUND',
  'EPIPE',
  'ETIMEDOUT',
  'UND_ERR_SOCKET',
])

function isTransient(error) {
  return TRANSIENT_STATUSES.has(error.statusCode) || TRANSIENT_CODES.has(error.code)
}

// Each call is made up to five times, waiting 1s, 2s, 4s and 8s at most, each spread by jitter so that jobs that failed
// together do not call together. Every call of the registry is safe to make again: announcing gives the same upload
// URL, uploading writes the same object, and finishing finds the publication that it recorded.
function retrying(what) {
  return {
    retries: 4,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 20_000,
    randomize: true,
    shouldRetry: ({ error }) => isTransient(error),
    onFailedAttempt: ({ error, attemptNumber, retriesLeft, retryDelay }) => {
      if (retriesLeft > 0 && isTransient(error)) {
        core.warning(
          `${what} failed: ${error.message}. Trying again in ${(retryDelay / 1000).toFixed(1)}s (attempt ${attemptNumber + 1} of ${attemptNumber + retriesLeft})`,
        )
      }
    },
  }
}

/** The calls that publish a plugin to the registry, with the OIDC token of the job. */
export class Registry {
  constructor(address, pluginId, token) {
    this.plugin = `${address.replace(/\/+$/, '')}/plugins/${pluginId}`
    this.client = new HttpClient(USER_AGENT, [new BearerCredentialHandler(token)])
  }

  /** Announces the zip of a version and is given the URL to upload it to. */
  async begin(announcement) {
    return pRetry(() => this.#post(`${this.plugin}/uploads`, announcement), retrying('Announcing the zip'))
  }

  /** Uploads the zip to the URL that begin gave, which is not the registry and takes no token. */
  async upload(url, content) {
    return pRetry(async () => {
      // The URL signs the length of the zip, so it is sent as a header: a stream has none of its own.
      const response = await new HttpClient(USER_AGENT).sendStream('PUT', url, Readable.from(content), {
        'Content-Length': content.length,
      })
      const body = await response.readBody()

      if (response.message.statusCode >= 300) {
        throw new HttpClientError(
          `Uploading the zip failed with ${response.message.statusCode}: ${body.trim()}`,
          response.message.statusCode,
        )
      }
    }, retrying('Uploading the zip'))
  }

  /** Says the zip is uploaded, which has the registry process it. Returns the publication. */
  async finish(announcement) {
    return pRetry(() => this.#post(`${this.plugin}/versions`, announcement), retrying('Finishing the publication'))
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
