// // import Fastify from 'fastify'
// // import jwt from '@fastify/jwt'
// // import { userController } from './controllers/userController'
// // import { statsRoutes } from './routes/stats'
// // import { createUserTable } from './services/userService'

// // async function main() {
// //   const app = Fastify()

// //   app.register(jwt, { secret: 'super-secret' })

// //   app.decorate('authenticate', async (req: any, res: any) => {
// //     try {
// //       await req.jwtVerify()
// //     } catch (err) {
// //       res.send(err)
// //     }
// //   })

// //   createUserTable()

// //   await app.register(userController)
// //   await app.register(statsRoutes)

// //   app.listen({ port: 3000 }, () => {
// //     console.log('Server running on http://localhost:3000')
// //   })
// // }

// // main()


// // import Fastify from 'fastify'
// // import jwt from '@fastify/jwt'
// // import multipart from '@fastify/multipart'
// // import fastifyStatic from '@fastify/static'
// // import path from 'path'

// // import { userController } from './controllers/userController'
// // import { statsRoutes } from './routes/stats'
// // import { avatarRoutes } from './routes/avatar'
// // import { createUserTable } from './services/userService'

// // async function main() {
// //   const app = Fastify()

// //   // JWT
// //   app.register(jwt, { secret: 'super-secret' })
// //   app.decorate('authenticate', async (req: any, res: any) => {
// //     try {
// //       await req.jwtVerify()
// //     } catch (err) {
// //       res.send(err)
// //     }
// //   })

// //   // Multipart for file uploads
// //   app.register(multipart)

// //   // Serve public static files (avatars etc.)
// //   app.register(fastifyStatic, {
// //     root: path.join(__dirname, 'public'),
// //     prefix: '/', // /avatars/default.png
// //   })

// //   // Setup DB
// //   createUserTable()

// //   // Routes
// //   await app.register(userController)
// //   await app.register(statsRoutes)
// //   await app.register(avatarRoutes)

// //   // Optional: root route
// //   app.get('/', async () => {
// //     return { message: 'API is running 🚀' }
// //   })

// //   app.listen({ port: 3000 }, () => {
// //     console.log('Server running on http://localhost:3000')
// //   })
// // }

// // main()

// // import Fastify from 'fastify'
// // import path from 'path'
// // import jwt from '@fastify/jwt'
// // import multipart from '@fastify/multipart'
// // import fastifyStatic from '@fastify/static'
// // import fastifyFormbody from '@fastify/formbody'

// // import { userController } from './controllers/userController'
// // import { statsRoutes } from './routes/stats'
// // import { avatarRoutes } from './routes/avatar'
// // import { createUserTable } from './services/userService'

// // async function main() {
// //   const app = Fastify()

// //   // JWT auth
// //   app.register(jwt, { secret: 'super-secret' })
// //   app.decorate('authenticate', async (req: any, res: any) => {
// //     try {
// //       await req.jwtVerify()
// //     } catch (err) {
// //       res.send(err)
// //     }
// //   })

// //   // Enable JSON body parsing (needed for POST /register etc.)
// //   app.register(fastifyFormbody)

// //   // Enable file uploads
// //   app.register(multipart)

// //   // Serve public static files (like /avatars/neves.png)
// //   app.register(fastifyStatic, {
// //     root: path.join(__dirname, 'public'),
// //     prefix: '/avatars/',
// //   })

// //   // Create DB table if not exists
// //   createUserTable()

// //   // Routes
// //   await app.register(userController)
// //   await app.register(statsRoutes)
// //   await app.register(avatarRoutes)

// //   // Root health check
// //   app.get('/', async () => {
// //     return { message: 'API is running 🚀' }
// //   })

// //   // Start server
// //   app.listen({ port: 3000 }, () => {
// //     console.log('Server running on http://localhost:3000')
// //   })
// // }

// // main()


// import Fastify from 'fastify'
// import jwt from '@fastify/jwt'
// import multipart from '@fastify/multipart'
// import fastifyStatic from '@fastify/static'
// import fastifyFormbody from '@fastify/formbody'
// import path from 'path'

// import { userController } from './controllers/userController'
// import { statsRoutes } from './routes/stats'
// import { avatarRoutes } from './routes/avatar'
// import { createUserTable } from './services/userService'

// async function main() {
//   const app = Fastify()

//   // JWT setup
//   app.register(jwt, { secret: 'super-secret' })
//   app.decorate('authenticate', async (req: any, res: any) => {
//     try {
//       await req.jwtVerify()
//     } catch (err) {
//       res.send(err)
//     }
//   })

//   // Accept JSON and form body
//   app.register(fastifyFormbody)
//   app.register(multipart)

//   // ✅ Serve avatars from public/avatars
//   app.register(fastifyStatic, {
//     root: path.join(__dirname, 'public'),
//     prefix: '/', // access via /public/avatars/...
//   })

//   // DB setup
//   createUserTable()

//   // Routes
//   await app.register(userController)
//   await app.register(statsRoutes)
//   await app.register(avatarRoutes)

//   // Health check
//   app.get('/', async () => {
//     return { message: 'API is running 🚀' }
//   })

//   app.listen({ port: 3000 }, () => {
//     console.log('Server running on http://localhost:3000')
//   })
// }

// main()


import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import fastifyFormbody from '@fastify/formbody'
import path from 'path'

import { userController } from './controllers/userController'
import { statsRoutes } from './routes/stats'
import { avatarRoutes } from './routes/avatar'
import { historyRoutes } from './routes/history'
import { profileRoutes } from './routes/profile' // ✅ NEW
import { createUserTable } from './services/userService'

async function main() {
  const app = Fastify()

  // JWT setup
  app.register(jwt, { secret: 'super-secret' })
  app.decorate('authenticate', async (req: any, res: any) => {
    try {
      await req.jwtVerify()
    } catch (err) {
      res.send(err)
    }
  })

  // Accept JSON and form body
  app.register(fastifyFormbody)
  app.register(multipart)

  // ✅ Serve avatars from public/avatars
  app.register(fastifyStatic, {
    root: path.join(__dirname, 'public'),
    prefix: '/', // access via /avatars/default.png
  })

  // DB setup
  createUserTable()

  // Routes
  await app.register(userController)
  await app.register(statsRoutes)
  await app.register(avatarRoutes)
  await app.register(historyRoutes)
  await app.register(profileRoutes) // ✅ NEW

  // Health check
  app.get('/', async () => {
    return { message: 'API is running 🚀' }
  })

  app.listen({ port: 3000 }, () => {
    console.log('Server running on http://localhost:3000')
  })
}

main()
