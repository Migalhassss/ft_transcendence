import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import protectedRoutes from './routes/protected'

dotenv.config()

const app = Fastify()

// Plugin JWT
app.register(jwt, {
  secret: process.env.JWT_SECRET as string,
})

// auth (ex: /auth/login, /auth/register)
app.register(authRoutes, { prefix: '/auth' })

// Test
app.get('/ping', async () => {
  return { pong: true }
})

// server
app.listen({ port: 3000 }, (err, address) => {
  if (err) throw err
  console.log(`Servidor a correr em: ${address}`)
})

app.register(protectedRoutes, { prefix: '/protected' })
