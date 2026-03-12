export default async function authMiddleware(ctx: any, next: () => Promise<void>) {
  if (!ctx.auth?.user) {
    return ctx.response.unauthorized({ message: 'Unauthorized' })
  }
  await next()
}
