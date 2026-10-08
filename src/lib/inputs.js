/**
 * The inputs of the action, which its step passes as JSON in `INPUTS` with `${{ toJSON(inputs) }}`. Run outside a job,
 * set `INPUTS` to the same JSON.
 */
export function inputs() {
  const json = process.env.INPUTS

  if (!json) {
    throw new Error('INPUTS is not set: the step of the action passes its inputs there as JSON')
  }

  return JSON.parse(json)
}
