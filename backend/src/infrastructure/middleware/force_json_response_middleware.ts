export default async function forceJsonResponseMiddleware(ctx: any, next: () => Promise<void>) {
  ctx.response.header('content-type', 'application/json; charset=utf-8')
  await next()
}
