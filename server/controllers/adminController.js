/*
 * Admin controller – works with file-based Blog & Comment stores
 */

import jwt from 'jsonwebtoken'
import BlogStore, {
  getAllBlogs as getAllBlogsFromStore,
  getBlogsByOwner,
  getBlogById as getBlogByIdFromStore,
} from '../models/Blog.js'
import CommentStore from '../models/Comment.js'
import {
  findUserByEmail,
  createUser,
  verifyPassword,
} from '../models/User.js'

export const adminLogin = async (req, res) => {
  try {
    const { email, password, mode } = req.body

    const jwtSecret = process.env.JWT_SECRET || 'quickblog-dev-secret'

    if (mode === 'register') {
      const existing = await findUserByEmail(email)
      if (existing) {
        return res.json({ success: false, message: 'User already exists' })
      }
      const user = await createUser({ email, password })
      const token = jwt.sign({ email: user.email, id: user.id }, jwtSecret)
      return res.json({ success: true, token })
    }

    const user = await findUserByEmail(email)
    if (!user) {
      return res.json({ success: false, message: 'User not found' })
    }

    const valid = await verifyPassword(user, password)
    if (!valid) {
      return res.json({ success: false, message: 'Invalid credentials' })
    }

    const token = jwt.sign({ email: user.email, id: user.id }, jwtSecret)
    res.json({ success: true, token })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const getAllBlogsAdmin = async (req, res) => {
  try {
    const userId = req.user?.id
    const blogs = userId ? await getBlogsByOwner(userId) : await getAllBlogsFromStore()
    res.json({ success: true, blogs })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const getAllComments = async (req, res) => {
  try {
    const userId = req.user?.id
    const comments = await CommentStore.getAllComments()

    if (!userId) {
      return res.json({ success: true, comments: [] })
    }

    const blogs = await getBlogsByOwner(userId)
    const blogIds = new Set(blogs.map(b => b._id))
    const filtered = comments.filter(c => blogIds.has(c.blog))
    res.json({ success: true, comments: filtered })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getDashboard = async (_req, res) => {
  try {
    const recentBlogs = (await getAllBlogsFromStore()).slice(0, 5)
    const blogs = await BlogStore.countBlogs()
    const comments = await CommentStore.countComments()
    const drafts = await BlogStore.countDraftBlogs()
    const dashboardData = {
      blogs,
      comments,
      drafts,
      recentBlogs,
    }
    res.json({ success: true, dashboardData })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const deleteCommentById = async (req, res) => {
  try {
    const { id } = req.body
    const comments = await CommentStore.getAllComments()
    const comment = comments.find(c => c._id === id)
    if (!comment) {
      return res.json({ success: false, message: 'Comment not found' })
    }
    const blog = await getBlogByIdFromStore(comment.blog)
    if (!req.user || !blog || blog.ownerId !== req.user.id) {
      return res.json({ success: false, message: 'Not allowed to delete this comment' })
    }
    await CommentStore.deleteCommentById(id)
    res.json({ success: true, message: 'Comment deleted successfully' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const approveCommentById = async (req, res) => {
  try {
    const { id } = req.body
    const comments = await CommentStore.getAllComments()
    const comment = comments.find(c => c._id === id)
    if (!comment) {
      return res.json({ success: false, message: 'Comment not found' })
    }
    const blog = await getBlogByIdFromStore(comment.blog)
    if (!req.user || !blog || blog.ownerId !== req.user.id) {
      return res.json({ success: false, message: 'Not allowed to approve this comment' })
    }
    await CommentStore.approveCommentById(id)
    res.json({ success: true, message: 'Comment approved successfully' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}