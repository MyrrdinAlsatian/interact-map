export const SUPPORTED_SCHEMA_VERSIONS = [
  "1.0",
  "0.9"
] as const
export type SchemaVersion = (typeof SUPPORTED_SCHEMA_VERSIONS)[number]

export const VALID_NODE_TYPES = [
  "application",
  "service",
  "container",
  "server",
  "external"
] as const
export type NodeType = (typeof VALID_NODE_TYPES)[number]

export const VALID_CRITICALITY = [
  "critical",
  "high",
  "medium",
  "low"
] as const
export type CriticalityLevel = (typeof VALID_CRITICALITY)[number]
