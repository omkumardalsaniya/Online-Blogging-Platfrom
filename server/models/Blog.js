/*
 * File-based Blog "model"
 * Stores blogs in JSON under /server/data/blogs.json
 */

import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, '..', 'data')
const BLOGS_FILE = path.join(DATA_DIR, 'blogs.json')

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.access(BLOGS_FILE)
  } catch {
    await fs.writeFile(BLOGS_FILE, JSON.stringify([], null, 2), 'utf-8')
  }
}

async function readBlogs() {
  await ensureDataFile()
  const raw = await fs.readFile(BLOGS_FILE, 'utf-8')
  return JSON.parse(raw || '[]')
}

async function writeBlogs(blogs) {
  await fs.writeFile(BLOGS_FILE, JSON.stringify(blogs, null, 2), 'utf-8')
}

export async function createBlog({ title, subTitle, description, category, image, isPublished, author, ownerId }) {
  const blogs = await readBlogs()
  const now = new Date().toISOString()
  const blog = {
    _id: crypto.randomBytes(12).toString('hex'),
    title,
    subTitle,
    description,
    category,
    image,
    author: author || 'Unknown Author',
    ownerId: ownerId || null,
    isPublished: !!isPublished,
    createdAt: now,
    updatedAt: now,
  }
  blogs.push(blog)
  await writeBlogs(blogs)
  return blog
}

export async function getPublishedBlogs() {
  const blogs = await readBlogs()
  return blogs.filter(b => b.isPublished)
}

export async function getAllBlogs() {
  const blogs = await readBlogs()
  return blogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function getBlogsByOwner(ownerId) {
  const blogs = await readBlogs()
  return blogs
    .filter(b => b.ownerId === ownerId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function getBlogById(id) {
  const blogs = await readBlogs()
  return blogs.find(b => b._id === id) || null
}

export async function deleteBlogById(id) {
  const blogs = await readBlogs()
  const remaining = blogs.filter(b => b._id !== id)
  await writeBlogs(remaining)
}

export async function togglePublishById(id) {
  const blogs = await readBlogs()
  const idx = blogs.findIndex(b => b._id === id)
  if (idx === -1) {
    return null
  }
  blogs[idx].isPublished = !blogs[idx].isPublished
  blogs[idx].updatedAt = new Date().toISOString()
  await writeBlogs(blogs)
  return blogs[idx]
}

export async function countBlogs() {
  const blogs = await readBlogs()
  return blogs.length
}

export async function countDraftBlogs() {
  const blogs = await readBlogs()
  return blogs.filter(b => !b.isPublished).length
}

export default {
  createBlog,
  getPublishedBlogs,
  getAllBlogs,
  getBlogById,
  deleteBlogById,
  togglePublishById,
  countBlogs,
  countDraftBlogs,
}