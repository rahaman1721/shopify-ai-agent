// Types matching backend Pydantic schemas

export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  productCards?: ProductCard[]
  toolLogs?: ToolCallLog[]
}

export interface ProductCard {
  title: string
  price: string
  availability: string
  url: string
  image_url: string | null
  handle: string
}

export interface ToolCallLog {
  tool_name: string
  input: Record<string, unknown>
  output: string
  duration_ms: number
}

export type SSEEventType = 'text' | 'product_card' | 'tool_log' | 'error' | 'done'

export interface SSEEvent {
  type: SSEEventType
  content?: string
  data?: ProductCard | ToolCallLog | Record<string, unknown>
}
