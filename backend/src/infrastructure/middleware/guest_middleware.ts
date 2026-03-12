export default async function guestMiddleware(ctx: any, next: () => Promise<void>) {
  if (ctx.auth?.user) {
    return ctx.response.forbidden({ message: 'Already authenticated' })
  }
  await next()
}
