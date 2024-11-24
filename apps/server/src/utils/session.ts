import * as crypto from 'crypto'

export function createSessionToken(sessionId: string): string {
  try {
    // Hash the session ID using SHA256
    const hash = crypto.createHash('sha256')
    hash.update(sessionId)
    const hashedSessionId = hash.digest('hex')

    // Return the hashed session ID as the session token
    return hashedSessionId
  } catch (error) {
    // Handle any errors that occur during token creation
    console.error('Error creating session token:', error)
    throw error
  }
}
