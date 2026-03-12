export default async function silentAuthMiddleware(_ctx: any, next: () => Promise<void>) {
  await next()
}
