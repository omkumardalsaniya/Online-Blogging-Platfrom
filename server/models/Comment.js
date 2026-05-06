/*
 * File-based Comment "model"
 * Stores comments in JSON under /server/data/comments.json
 */

import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, '..', 'data')
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json')

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.access(COMMENTS_FILE)
  } catch {
    await fs.writeFile(COMMENTS_FILE, JSON.stringify([], null, 2), 'utf-8')
  }
}

async function readComments() {
  await ensureDataFile()
  const raw = await fs.readFile(COMMENTS_FILE, 'utf-8')
  return JSON.parse(raw || '[]')
}

async function writeComments(comments) {
  await fs.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf-8')
}

export async function createComment({ blog, name, content, isApproved = false }) {
  const comments = await readComments()
  const now = new Date().toISOString()
  const comment = {
    _id: crypto.randomBytes(12).toString('hex'),
    blog,
    name,
    content,
    isApproved,
    createdAt: now,
    updatedAt: now,
  }
  comments.push(comment)
  await writeComments(comments)
  return comment
}

export async function getCommentsByBlog(blogId, { approvedOnly = false } = {}) {
  const comments = await readComments()
  return comments
    .filter(c => c.blog === blogId && (!approvedOnly || c.isApproved))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function deleteCommentsByBlog(blogId) {
  const comments = await readComments()
  const remaining = comments.filter(c => c.blog !== blogId)
  await writeComments(remaining)
}

export async function getAllComments() {
  const comments = await readComments()
  return comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function deleteCommentById(id) {
  const comments = await readComments()
  const remaining = comments.filter(c => c._id !== id)
  await writeComments(remaining)
}

export async function approveCommentById(id) {
  const comments = await readComments()
  const idx = comments.findIndex(c => c._id === id)
  if (idx === -1) {
    return null
  }
  comments[idx].isApproved = true
  comments[idx].updatedAt = new Date().toISOString()
  await writeComments(comments)
  return comments[idx]
}

export async function countComments() {
  const comments = await readComments()
  return comments.length
}

export default {
  createComment,
  getCommentsByBlog,
  deleteCommentsByBlog,
  getAllComments,
  deleteCommentById,
  approveCommentById,
  countComments,
}