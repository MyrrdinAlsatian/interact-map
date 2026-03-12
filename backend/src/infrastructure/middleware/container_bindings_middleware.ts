export default async function containerBindingsMiddleware(_ctx: any, next: () => Promise<void>) {
  await next()
}
