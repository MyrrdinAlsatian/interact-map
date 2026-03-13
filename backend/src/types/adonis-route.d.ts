declare module '@ioc:Adonis/Core/Route' {
  const Route: {
    get(path: string, handler: string): any
    post(path: string, handler: string): any
    group(callback: () => void): { middleware(names: string[]): any }
  }

  export default Route
}
