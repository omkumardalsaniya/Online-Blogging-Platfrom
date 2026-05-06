import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, '..', 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.access(USERS_FILE)
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2), 'utf-8')
  }
}

async function readUsers() {
  await ensureDataFile()
  const raw = await fs.readFile(USERS_FILE, 'utf-8')
  return JSON.parse(raw || '[]')
}

async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8')
}

export async function findUserByEmail(email) {
  const users = await readUsers()
  return users.find(u => u.email === email) || null
}

export async function createUser({ email, password }) {
  const users = await readUsers()
  const id = crypto.randomBytes(12).toString('hex')
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')

  const user = {
    id,
    email,
    passwordHash: hash,
    salt,
  }

  users.push(user)
  await writeUsers(users)
  return user
}

export async function verifyPassword(user, password) {
  const hash = crypto.pbkdf2Sync(password, user.salt, 10000, 64, 'sha512').toString('hex')
  return hash === user.passwordHash
}

export default {
  findUserByEmail,
  createUser,
  verifyPassword,
}

