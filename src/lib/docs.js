import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

import * as core from '@actions/core'
import AdmZip from 'adm-zip'

/** The most a page of docs can hold, in bytes. */
const PAGE_LIMIT = 500 * 1024

const TRUNCATED_NOTE = Buffer.from('\n\n> This page was truncated: it is longer than 500 KB.\n')

/** The markdown files below the folder, as paths relative to it with `/` between the folders. */
async function pagePaths(folder) {
  const entries = await readdir(folder, { recursive: true, withFileTypes: true })

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => relative(folder, join(entry.parentPath, entry.name)).split(sep).join('/'))
    .sort()
}

/** The page, cut at the limit on a whole character, with a note at its end that it was. */
function truncate(path, content) {
  if (content.length <= PAGE_LIMIT) {
    return content
  }

  core.warning(`${path} is longer than 500 KB and is truncated`)

  let end = PAGE_LIMIT - TRUNCATED_NOTE.length

  // A byte that starts with 10 continues a character, so cutting before it would split the character.
  while ((content[end] & 0b11000000) === 0b10000000) {
    end--
  }

  return Buffer.concat([content.subarray(0, end), TRUNCATED_NOTE])
}

/** The zip of the markdown pages in the folder, with its size and its sha256, which the registry asks for. */
export async function zipDocs(folder) {
  const paths = await pagePaths(folder)

  if (paths.length === 0) {
    throw new Error(`There are no markdown pages in ${folder}`)
  }

  const zip = new AdmZip()

  for (const path of paths) {
    const page = truncate(path, await readFile(join(folder, path)))

    core.info(`  ${path} (${page.length} bytes)`)
    zip.addFile(path, page)
  }

  const content = zip.toBuffer()

  return {
    content,
    pages: paths.length,
    size: content.length,
    sha256: createHash('sha256').update(content).digest('hex'),
  }
}
