/** What the job was started by must be a push of the tag `v<version>`. Returns the tag and the version. */
export function versionFromTag() {
  const { GITHUB_REF_TYPE: type, GITHUB_REF_NAME: tag = '' } = process.env

  if (type !== 'tag' || !tag.startsWith('v')) {
    throw new Error(`Run from a push of a tag named v<version>, not from ${process.env.GITHUB_REF}`)
  }

  return { tag, version: tag.slice(1) }
}
