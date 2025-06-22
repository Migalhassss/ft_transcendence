import { FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcrypt'

// Temporary "database"
const users: any[] = []

export async function register(req: FastifyRequest, reply: FastifyReply) {
  const { username, password } = req.body as any

  if (!username || !password)
	return reply.code(400).send({ error: 'Username and password are required.' })

  const existing = users.find(u => u.username === username)
  if (existing)
	return reply.code(400).send({ error: 'Username already exists.' })

  const hashed = await bcrypt.hash(password, 10)
  users.push({ username, password: hashed })

  reply.send({ message: 'User successfully registered.' })
}

export async function login(req: FastifyRequest, reply: FastifyReply) {
  const { username, password } = req.body as any

  const user = users.find(u => u.username === username)
  if (!user)
	return reply.code(401).send({ error: 'User not found.' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid)
	return reply.code(401).send({ error: 'Incorrect password.' })

  const token = reply.server.jwt.sign({ username })
  reply.send({ token })
}
