import React, { useState, useRef, useEffect, useCallback } from 'react'
import type { ChatMessage, SSEEvent, ProductCard, ToolCallLog } from '../types'
import { ProductCardComponent } from './ProductCard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function generateId() {
  return Math.random().toString(36).slice(2, 11)
}

function generateSessionId() {
  const stored = sessionStorage.getItem('shopify_ai_session')
  if (stored) return stored
  const id = generateId() + generateId()
  sessionStorage.setItem('shopify_ai_session', id)
  return id
}

interface ChatWindowProps {
  onClose?: () => void
  onNewMessage?: () => void
}

export function ChatWindow({ onClose, onNewMessage }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: generateId(),
      role: 'assistant',
      content:
        'Hi there! 👋 I can help you find products, check your order status, or answer any questions about our store.\n\nWhat are you looking for today?',
      timestamp: new Date(),
    },
    {
      id: generateId(),
      role: 'user',
      content: "I'm looking for a black pegboard for my workspace",
      timestamp: new Date(),
    },
    {
      id: generateId(),
      role: 'assistant',
      content: 'Great choice! Here are our best black pegboards for workspaces. 🛠️',
      timestamp: new Date(),
      productCards: [
        {
          title: 'Premium Black Pegboard',
          price: '$49.99',
          availability: 'In Stock',
          url: '#',
          image_url: '/product_pegboard_1.png',
          handle: 'premium-black-pegboard',
        },
        {
          title: 'Workspace Pegboard Kit',
          price: '$72.00',
          availability: 'In Stock',
          url: '#',
          image_url: '/product_pegboard_2.png',
          handle: 'workspace-pegboard-kit',
        },
        {
          title: 'Modern Pegboard Panel',
          price: '$59.99',
          availability: 'In Stock',
          url: '#',
          image_url: '/product_pegboard_3.png',
          handle: 'modern-pegboard-panel',
        },
      ],
    },
  ])

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const sessionId = useRef(generateSessionId())

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride || input).trim()
      if (!text || isStreaming) return
      setInput('')

      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])
      setIsStreaming(true)
      onNewMessage?.()

      const assistantId = generateId()
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', timestamp: new Date(), productCards: [], toolLogs: [] },
      ])

      try {
        const response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, session_id: sessionId.current }),
        })

        const reader = response.body!.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { value, done } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

          for (const line of lines) {
            const eventStr = line.slice(6).trim()
            if (!eventStr) continue
            const event: SSEEvent = JSON.parse(eventStr)

            if (event.type === 'text' && event.content) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + event.content } : m,
                ),
              )
            } else if (event.type === 'product_card' && event.data) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, productCards: [...(m.productCards || []), event.data as ProductCard] }
                    : m,
                ),
              )
            } else if (event.type === 'tool_log' && event.data) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, toolLogs: [...(m.toolLogs || []), event.data as ToolCallLog] }
                    : m,
                ),
              )
            } else if (event.type === 'done') {
              setIsStreaming(false)
            } else if (event.type === 'error') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: 'Sorry, something went wrong. Please try again. 🙏' }
                    : m,
                ),
              )
              setIsStreaming(false)
            }
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: 'Connection error. Please check your internet and try again.' }
              : m,
          ),
        )
        setIsStreaming(false)
      }
    },
    [input, isStreaming, onNewMessage],
  )

  const quickActions = [
    {
      label: 'Track Order',
      text: 'I want to track my order',
      icon: (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      label: 'Returns',
      text: 'What is your return policy?',
      icon: (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l6-6M3 10l6 6" />
        </svg>
      ),
    },
    {
      label: 'FAQs',
      text: 'What are your most asked questions?',
      icon: (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01" />
        </svg>
      ),
    },
    {
      label: 'Special Offers',
      text: 'Do you have any special offers or discounts?',
      icon: (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a2 2 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 10V5a2 2 0 012-2z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="w-[390px] h-[630px] rounded-[28px] overflow-hidden flex flex-col bg-[#181920] shadow-[0_25px_80px_rgba(0,0,0,0.45)] border border-[#2A2B36] font-sans">
      {/* ── HEADER ── */}
      <div className="bg-[#181920] px-4 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img src="/shopify_header_logo.png" alt="Shopify" className="w-10 h-10 rounded-xl object-contain shrink-0 shadow" />
          <div className="h-8 w-[1px] bg-white/20"></div>
          <div className="leading-tight pl-0.5">
            <h2 className="text-[15px] font-bold text-white tracking-tight">Shopify AI Agent</h2>
            <p className="text-[12px] text-[#9CA3AF]">Your shopping assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
            <span className="text-[12px] font-medium text-[#E5E7EB]">Online</span>
          </div>
          <button
            onClick={() => setShowDebug((v) => !v)}
            title="Debug panel"
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-[#E5E7EB] flex items-center justify-center text-xs transition-colors"
          >
            🔍
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-[#E5E7EB] flex items-center justify-center text-xs transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── DEBUG PANEL ── */}
      {showDebug && (
        <div className="bg-[#0D0E15] text-[#A6E3A1] p-3 text-xs font-mono max-h-32 overflow-y-auto border-b border-white/10">
          <div className="text-[#89B4FA] font-bold mb-1">⚡ Tool Call Inspector</div>
          {messages.flatMap((m) => m.toolLogs || []).length === 0 ? (
            <div className="text-gray-500">No tools called yet</div>
          ) : (
            messages
              .flatMap((m) => m.toolLogs || [])
              .map((log, i) => (
                <div key={i} className="mb-1">
                  🔧 {log.tool_name} ({log.duration_ms}ms)
                </div>
              ))
          )}
        </div>
      )}

      {/* ── WHITE CARD CONTAINER ── */}
      <div className="bg-white rounded-t-[24px] flex flex-col flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-white">
          {messages.map((msg) => {
            const isUser = msg.role === 'user'

            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'items-start gap-2.5'}`}>
                {!isUser && (
                  <img src="/shopify_avatar_logo.png" alt="Agent" className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 shadow-sm" />
                )}
                <div className={`flex flex-col ${isUser ? 'items-end' : 'max-w-[315px]'}`}>
                  <div
                    className={`text-[13.5px] leading-relaxed p-3.5 ${
                      isUser
                        ? 'bg-[#1E1F2E] text-white rounded-[20px] rounded-br-sm max-w-[270px]'
                        : 'bg-[#F1F3F6] text-[#1E232A] rounded-[20px] rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Product Cards Row */}
                  {(msg.productCards || []).length > 0 && (
                    <div className="flex gap-2.5 overflow-x-auto pb-1.5 mt-2.5">
                      {msg.productCards!.map((card, i) => (
                        <ProductCardComponent key={i} card={card} />
                      ))}
                    </div>
                  )}

                  <span className="text-[11px] text-[#9CA3AF] mt-1 pl-1">
                    10:33 AM {isUser && <span className="font-bold text-[#6B7280]">✔</span>}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-3 py-2 border-t border-[#F3F4F6] flex items-center gap-2 overflow-x-auto bg-white shrink-0">
          {quickActions.map((qa) => (
            <button
              key={qa.label}
              onClick={() => sendMessage(qa.text)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#D1D5DB] hover:border-[#1E1F2E] text-[12px] font-medium text-[#1E232A] bg-white whitespace-nowrap shadow-sm hover:bg-[#F9FAFB] transition-all"
            >
              {qa.icon}
              <span>{qa.label}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="px-3.5 py-2.5 bg-white border-t border-[#F3F4F6] flex items-center gap-2 shrink-0">
          <div className="flex-1 bg-white rounded-full px-3 py-2 flex items-center gap-2.5 border border-[#D1D5DB] focus-within:border-[#1E1F2E] transition-colors">
            <button className="w-6 h-6 rounded-full flex items-center justify-center text-[#6B7280] hover:text-[#1E1F2E] transition-colors">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="w-full bg-transparent text-[13.5px] text-[#1E232A] placeholder-[#9CA3AF] focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
          </div>

          <button
            onClick={() => sendMessage()}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-full bg-[#181926] hover:bg-[#252738] disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95"
          >
            <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24" className="transform rotate-45 -translate-y-0.5 -translate-x-0.5">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <div className="bg-white px-4 py-2 border-t border-[#F3F4F6] flex items-center justify-between text-[11.5px] text-[#6B7280] shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-[#10B981] flex items-center justify-center text-white text-[9px] font-bold">
              ✓
            </div>
            <span>Powered by</span>
            <svg width="13" height="13" viewBox="0 0 24 24" className="inline-block">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            <span className="text-[#1E232A] font-semibold">Gemini AI</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="h-3 w-[1px] bg-gray-300"></div>
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20" className="text-[#6B7280]">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Secure & Private</span>
          </div>
        </div>
      </div>
    </div>
  )
}
