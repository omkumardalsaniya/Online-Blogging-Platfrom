/*
 * Copyright (c) 2025 Yash Kushwaha
 * Licensed under the MIT License. See LICENSE file for details.
*/

import jwt from 'jsonwebtoken'

const auth = (req, _res, next) => {
  const token = req.headers.authorization
  const jwtSecret = process.env.JWT_SECRET || 'quickblog-dev-secret'

  if (!token || token === 'null' || token === 'undefined') {
    return next()
  }

  try {
    const decoded = jwt.verify(token, jwtSecret)
    req.user = decoded
  } catch (_error) {
    // ignore invalid token, treat as unauthenticated
  }

  return next()
}

export default auth