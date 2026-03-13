export type NodeType = 'application' | 'service' | 'container' | 'server' | 'external'
export type CriticalityLevel = 'critical' | 'high' | 'medium' | 'low'
export type DependencyType = 'required' | 'optional' | 'async' | 'cache'
export type ErrorSeverity = 'error' | 'warning'
export type ActorRole = 'viewer' | 'analyst' | 'architect' | 'admin'
export type AuditOutcome = 'success' | 'denied' | 'failure'
export type TraversalMode = 'bfs' | 'dfs'

export const SUPPORTED_SCHEMA_VERSIONS = ['1.0', '0.9'] as const
export type SchemaVersion = (typeof SUPPORTED_SCHEMA_VERSIONS)[number]

export interface ContractError {
  code: string
  message: string
  path?: string
  severity: ErrorSeverity
}

export interface GraphNode {
  id: string
  type: NodeType
  label: string
  metadata?: Record<string, unknown>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  criticality: CriticalityLevel
  dependencyType?: DependencyType
  protocol?: string
}

export interface GraphContract {
  schemaVersion: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  errors: ContractError[]
}

export interface ErrorEnvelope {
  error: ContractError
  fallbackNavigation?: 'full_page'
}

export interface IncidentSimulationRequest {
  projectId: string
  failedNodeId: string
  traversal?: TraversalMode
}

export interface IncidentSimulationResult {
  failedNodeId: string
  traversal: TraversalMode
  impactedNodes: string[]
  impactedEdges: string[]
}
