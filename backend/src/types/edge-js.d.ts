declare module 'edge.js' {
  const edge: any
  export default edge
}

declare module 'edge.js/plugins/migrate' {
  export function migrate(edge: any): void
}
