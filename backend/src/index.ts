import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import protectedRoutes from './routes/protected'
import cors from '@fastify/cors'

dotenv.config()
console.log('JWT_SECRET:', process.env.JWT_SECRET)

async function start() {
  const app = Fastify()

  // CORS
  await app.register(cors, {
    origin: '*', // só para dev
  })

  // JWT
  app.register(jwt, {
    secret: process.env.JWT_SECRET as string,
  })

  // Routes
  app.register(authRoutes, { prefix: '/auth' })
  app.register(protectedRoutes, { prefix: '/protected' })

  // Test route
  app.get('/ping', async () => {
    return { pong: true }
  })

  // Start server
  try {
    const address = await app.listen({ port: 3000 })
    console.log(`Servidor a correr em: ${address}`) 
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
