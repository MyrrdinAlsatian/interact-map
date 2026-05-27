import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..', '..')
const sharedJsonPath = join(rootDir, 'shared', 'graph-contract-metadata.json')
const backendMetadataPath = join(rootDir, 'backend', 'src', 'domain', 'contracts', 'graph_contract_metadata.ts')
const frontendMetadataPath = join(rootDir, 'frontend', 'lib', 'graph-contract-metadata.js')

async function main() {
  const file = await readFile(sharedJsonPath, 'utf8')
  const metadata = JSON.parse(file)

  const backendContents = `export const SUPPORTED_SCHEMA_VERSIONS = ${JSON.stringify(metadata.supportedSchemaVersions, null, 2)} as const
export type SchemaVersion = (typeof SUPPORTED_SCHEMA_VERSIONS)[number]

export const VALID_NODE_TYPES = ${JSON.stringify(metadata.validNodeTypes, null, 2)} as const
export type NodeType = (typeof VALID_NODE_TYPES)[number]

export const VALID_CRITICALITY = ${JSON.stringify(metadata.validCriticalityLevels, null, 2)} as const
export type CriticalityLevel = (typeof VALID_CRITICALITY)[number]
`

  const frontendContents = `export const SUPPORTED_SCHEMA_VERSIONS = ${JSON.stringify(metadata.supportedSchemaVersions, null, 2)}
export const NODE_TYPES = ${JSON.stringify(metadata.validNodeTypes, null, 2)}
export const CRITICALITY_LEVELS = ${JSON.stringify(metadata.validCriticalityLevels, null, 2)}
`

  await writeFile(backendMetadataPath, backendContents, 'utf8')
  await writeFile(frontendMetadataPath, frontendContents, 'utf8')
  console.log('Generated shared graph contract metadata wrappers.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
