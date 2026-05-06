/*
 * Blog controller – file-based storage + optional Gemini AI integration
 */

import {
  createBlog,
  getPublishedBlogs,
  getBlogById as getBlogByIdFromStore,
  deleteBlogById as deleteBlogFromStore,
  togglePublishById,
} from '../models/Blog.js'
import {
  createComment,
  getCommentsByBlog,
  deleteCommentsByBlog,
} from '../models/Comment.js'

export const addBlog = async (req, res) => {
  try {
    const { title, subTitle, description, category, isPublished, author } = JSON.parse(req.body.blog)

    const imageFile = req.file

    if (!title || !description || !category || !imageFile) {
      return res.json({ success: false, message: 'Missing required fields' })
    }

    // Image is stored locally by multer; build absolute URL so frontend can display it
    const baseUrl = process.env.PUBLIC_SERVER_URL || `http://localhost:${process.env.PORT || 3000}`
    const image = `${baseUrl}/uploads/${imageFile.filename}`

    const ownerId = req.user?.id || null

    await createBlog({ title, subTitle, description, category, image, isPublished, author, ownerId })

    res.json({ success: true, message: 'Blog added successfully' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const getAllBlogs = async (_req, res) => {
  try {
    const blogs = await getPublishedBlogs()
    res.json({ success: true, blogs })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const getBlogById = async (req, res) => {
  try {
    const { blogId } = req.params
    const blog = await getBlogByIdFromStore(blogId)
    if (!blog) {
      return res.json({ success: false, message: 'Blog not found' })
    }
    res.json({ success: true, blog })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const deleteBlogById = async (req, res) => {
  try {
    const { id } = req.body
    const blog = await getBlogByIdFromStore(id)
    if (!blog) {
      return res.json({ success: false, message: 'Blog not found' })
    }
    if (!req.user || blog.ownerId !== req.user.id) {
      return res.json({ success: false, message: 'Not allowed to delete this blog' })
    }
    await deleteBlogFromStore(id)
    await deleteCommentsByBlog(id)
    res.json({ success: true, message: 'Blog deleted successfully' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const togglePublish = async (req, res) => {
  try {
    const { id } = req.body
    const blog = await togglePublishById(id)
    if (!blog) {
      return res.json({ success: false, message: 'Blog not found' })
    }
    if (!req.user || blog.ownerId !== req.user.id) {
      return res.json({ success: false, message: 'Not allowed to update this blog' })
    }
    res.json({ success: true, message: 'Blog status updated' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const addComment = async (req, res) => {
  try {
    const { blog, name, content } = req.body
    if (!blog || !name || !content) {
      return res.json({ success: false, message: 'Missing required fields' })
    }
    await createComment({ blog, name, content })
    res.json({ success: true, message: 'Comment added for review' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const getBlogComments = async (req, res) => {
  try {
    const { blogId } = req.body
    const comments = await getCommentsByBlog(blogId, { approvedOnly: true })
    res.json({ success: true, comments })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const generateBlogContent = async (req, res) => {
  try {
    const { title, subTitle, category } = req.body
    const mainTitle = title || 'Your blog title'
    const sub = subTitle || ''
    const cat = category || 'General'

    const paragraphs = [
      `Welcome to this ${cat.toLowerCase()} blog post about ${mainTitle}. In this article, we will explore the key ideas behind ${mainTitle.toLowerCase()} and why it matters right now.`,
      sub
        ? `First, let us look at "${sub}", which is a core part of understanding ${mainTitle.toLowerCase()}. This section will give you context and background so the main topic feels more concrete.`
        : `To start, we will build a clear foundation so that anyone new to ${mainTitle.toLowerCase()} can follow along without feeling lost.`,
      `Next, we will dive deeper into the most important concepts, examples, and practical tips related to ${mainTitle.toLowerCase()}. The goal is to move from simple explanation to useful, real-world insight.`,
      `Finally, we will wrap up with a short conclusion that ties everything together and reminds you of the most important takeaways from ${mainTitle.toLowerCase()}.`,
    ]

    const html = `
<h2>${mainTitle}</h2>
<p>${paragraphs[0]}</p>
<h3>${sub || 'Background and context'}</h3>
<p>${paragraphs[1]}</p>
<h3>Main ideas of ${mainTitle}</h3>
<p>${paragraphs[2]}</p>
<h3>Conclusion</h3>
<p>${paragraphs[3]}</p>
`.trim()

    res.json({ success: true, html })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}