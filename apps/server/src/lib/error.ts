import { type StatusCode } from 'hono/utils/http-status'

interface ServerErrorOptions {
  data?: any
  statusCode?: StatusCode
  message?: string
  description?: string
}

export class ServerError extends Error {
  private statusCode: StatusCode = 500
  public message = 'Something went wrong'
  private data: any
  private description: string | null = null

  constructor(options: ServerErrorOptions) {
    super(options.message)
    this.statusCode = options.statusCode || 500
    this.message = options.message || 'Something went wrong'
    this.data = options.data
    this.description = options.description || null
  }

  get response() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      data: this.data || null,
      description: this.description,
    }
  }
}
