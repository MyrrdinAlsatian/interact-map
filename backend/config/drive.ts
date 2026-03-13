// import env from '#infrascture /env'
// import app from '@adonisjs/core/services/app'
// import { defineConfig, services } from '@adonisjs/drive'

// const driveConfig = defineConfig({
//   default: env.get('DRIVE_DISK'),

//   /**
//    * The services object can be used to configure multiple file system
//    * services each using the same or a different driver.
//    */
//   services: {
//     fs: services.fs({
//       location: app.makePath('storage'),
//       serveFiles: true,
//       routeBasePath: '/uploads',
//       visibility: 'public',
//     }),
//     s3: services.s3({
//       credentials: {
//         accessKeyId: env.get('SUPABASE_ACCESS_KEY'),
//         secretAccessKey: env.get('SUPABASE_SECRET_KEY'),
//       },
//       region: env.get('SUPABASE_REGION'),
//       bucket: env.get('S3_BUCKET'),
//       endpoint: env.get('SUPABASE_ENDPOINT'),
//       visibility: 'public',
//     }),
//   },
// })

// export default driveConfig

// declare module '@adonisjs/drive/types' {
//   export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
// }
