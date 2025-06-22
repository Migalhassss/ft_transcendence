import { FastifyInstance } from 'fastify'
import { register, login } from '../controllers/authController'

export default async function (app: FastifyInstance) {
  app.post('/register', register)
  app.post('/login', login)
}
