import type { GraphNode, GraphEdge, ContractError } from '#domain/contracts/dto/graph_contract_dto'

export type ParserSourceType = 'docker-compose' | 'docker-inspect' | 'docker-ps'

export interface ParserInput {
  sourceType: ParserSourceType
  schemaVersion: string
  payload: unknown
}

export interface ParserResult {
  schemaVersion: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  errors: ContractError[]
  warnings: ContractError[]
}
