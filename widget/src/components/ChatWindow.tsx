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

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

/** Shopify bag SVG icon */
function ShopifyIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 109 124" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M74.7 14.8c-.1-.7-.7-1.1-1.3-1.1-.6 0-11.1-.8-11.1-.8s-7.4-7.3-8.2-8.1c-.8-.8-2.3-.6-2.9-.4L46.6 7c-1.9-5.5-5.3-10.5-11.2-10.5h-.5C33.1-5.5 31.4-6 29.9-6c-10.9 0-16.1 13.6-17.7 20.5l-11 3.4c-3.4 1.1-3.5 1.1-4 4.3L-.9 97l55.9 10.5 30.2-7.3L74.7 14.8z" fill="#95BF47" transform="translate(14,8)"/>
      <path d="M73.4 13.7c-.6 0-11.1-.8-11.1-.8s-7.4-7.3-8.2-8.1c-.3-.3-.7-.4-1.1-.5l-5.8 118.3 30.2-7.3L74.7 14.8c-.1-.7-.7-1.1-1.3-1.1z" fill="#5E8E3E" transform="translate(14,8)"/>
      <path d="M46.3 38.2l-3.7 11c0 0-3.3-1.7-7.3-1.7-5.9 0-6.2 3.7-6.2 4.6 0 5.1 13.3 7 13.3 18.9 0 9.4-5.9 15.4-13.9 15.4-9.6 0-14.4-6-14.4-6l2.6-8.4s5 4.3 9.2 4.3c2.7 0 3.9-2.2 3.9-3.7 0-6.6-10.9-6.9-10.9-17.8 0-9.1 6.6-18 19.8-18 5.1 0 7.6 1.4 7.6 1.4z" fill="#fff" transform="translate(14,8)"/>
    </svg>
  )
}

/** Bot avatar bubble */
function BotAvatar() {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      background: 'linear-gradient(135deg, #96BF48 0%, #5E8E3E 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, boxShadow: '0 2px 8px rgba(94,142,62,0.35)',
    }}>
      <ShopifyIcon size={22} />
    </div>
  )
}

/** Typing indicator dots */
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, padding: '4px 0' }}>
      <BotAvatar />
      <div style={{
        background: '#F0F0F5', borderRadius: '20px 20px 20px 4px',
        padding: '14px 18px', display: 'flex', gap: 5, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#9CA3AF',
              display: 'inline-block',
              animation: `typingDot 1.2s ${i * 0.2}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

/** Quick action pill */
function QuickActionPill({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '9px 16px',
        border: '1.5px solid #E0E0E8',
        borderRadius: 999,
        background: '#fff',
        fontSize: 13,
        fontWeight: 500,
        color: '#1A1A2E',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#008060'
        ;(e.currentTarget as HTMLButtonElement).style.color = '#008060'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#E0E0E8'
        ;(e.currentTarget as HTMLButtonElement).style.color = '#1A1A2E'
      }}
    >
      <span style={{ fontSize: 15 }}>{icon}</span>
      {label}
    </button>
  )
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
      content: 'Hi there! 👋 I can help you find products, check your order status, or answer any questions about our store.\n\nWhat are you looking for today?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const sessionId = useRef(generateSessionId())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (textOverride?: string) => {
    const text = (textOverride || input).trim()
    if (!text || isStreaming) return
    setInput('')

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsStreaming(true)
    onNewMessage?.()

    const assistantId = generateId()
    setMessages(prev => [
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
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const eventStr = line.slice(6).trim()
          if (!eventStr) continue
          const event: SSEEvent = JSON.parse(eventStr)

          if (event.type === 'text' && event.content) {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + event.content } : m,
              ),
            )
          } else if (event.type === 'product_card' && event.data) {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, productCards: [...(m.productCards || []), event.data as ProductCard] }
                  : m,
              ),
            )
          } else if (event.type === 'tool_log' && event.data) {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, toolLogs: [...(m.toolLogs || []), event.data as ToolCallLog] }
                  : m,
              ),
            )
          } else if (event.type === 'done') {
            setIsStreaming(false)
          } else if (event.type === 'error') {
            setMessages(prev =>
              prev.map(m =>
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
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: 'Connection error. Please check your internet and try again.' }
            : m,
        ),
      )
      setIsStreaming(false)
    }
  }, [input, isStreaming, onNewMessage])

  const quickActions = [
    { icon: '📦', label: 'Track Order', text: 'I want to track my order' },
    { icon: '↩️', label: 'Returns', text: 'What is your return policy?' },
    { icon: '❓', label: 'FAQs', text: 'What are your most asked questions?' },
    { icon: '🏷️', label: 'Special Offers', text: 'Do you have any special offers or discounts?' },
  ]

  const allToolLogs = messages.flatMap(m => m.toolLogs || [])

  return (
    <>
      {/* Inject keyframe animation */}
      <style>{`
        @keyframes typingDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1.1); opacity: 1; }
        }
        .shopify-chat-scroll::-webkit-scrollbar { width: 4px; }
        .shopify-chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .shopify-chat-scroll::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
        .shopify-chat-input:focus { outline: none; box-shadow: none; }
        .shopify-send-btn:hover:not(:disabled) { background: #005c47 !important; transform: scale(1.05); }
        .shopify-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .shopify-send-btn { transition: all 0.15s ease; }
      `}</style>

      <div style={{
        width: 390,
        height: 620,
        borderRadius: 20,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxShadow: '0 24px 80px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.2)',
        background: '#fff',
      }}>

        {/* ── HEADER ── */}
        <div style={{
          background: '#1A1A2E',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}>
          {/* Shopify logo box */}
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'linear-gradient(135deg, #96BF48, #5E8E3E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 22 }}>🛍️</span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: '-0.2px' }}>
              Shopify AI Agent
            </div>
            <div style={{ color: '#A0A0B8', fontSize: 12, marginTop: 1 }}>
              Your shopping assistant
            </div>
          </div>

          {/* Online dot + label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginRight: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#4ADE80',
              boxShadow: '0 0 6px #4ADE80',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ color: '#4ADE80', fontSize: 12, fontWeight: 500 }}>Online</span>
          </div>

          {/* Debug + Close */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setShowDebug(v => !v)}
              title="Toggle debug panel"
              style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', color: '#A0A0B8',
                borderRadius: 8, padding: '5px 9px', cursor: 'pointer', fontSize: 11,
                fontFamily: 'inherit',
              }}
            >
              🔍
            </button>
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 32, height: 32,
                  background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                  borderRadius: 8, cursor: 'pointer', fontSize: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'inherit',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── DEBUG PANEL ── */}
        {showDebug && (
          <div style={{
            background: '#0D0D1A', color: '#A6E3A1', padding: '10px 14px',
            fontSize: 11, fontFamily: '"Fira Code", "Cascadia Code", monospace',
            maxHeight: 130, overflowY: 'auto', flexShrink: 0,
            borderBottom: '1px solid #1e1e3a',
          }}>
            <div style={{ color: '#89B4FA', marginBottom: 4, fontWeight: 600 }}>
              ⚡ Tool Call Log ({allToolLogs.length} calls)
            </div>
            {allToolLogs.length === 0
              ? <div style={{ opacity: 0.5 }}>No tool calls yet. Ask about a product!</div>
              : allToolLogs.map((log, i) => (
                  <div key={i} style={{ marginBottom: 8, borderLeft: '2px solid #89B4FA', paddingLeft: 8 }}>
                    <div>🔧 <strong>{log.tool_name}</strong> <span style={{ color: '#F38BA8' }}>{log.duration_ms}ms</span></div>
                    <div style={{ color: '#CDD6F4' }}>→ {JSON.stringify(log.input).slice(0, 80)}</div>
                    <div style={{ color: '#A6E3A1' }}>← {log.output.slice(0, 100)}{log.output.length > 100 ? '…' : ''}</div>
                  </div>
                ))
            }
          </div>
        )}

        {/* ── MESSAGES ── */}
        <div
          className="shopify-chat-scroll"
          style={{
            flex: 1, overflowY: 'auto',
            padding: '20px 16px',
            display: 'flex', flexDirection: 'column', gap: 16,
            background: '#F7F7FA',
          }}
        >
          {messages.map((msg, msgIdx) => {
            const isUser = msg.role === 'user'
            const isLast = msgIdx === messages.length - 1
            const showTyping = isLast && isStreaming && !isUser && msg.content === '' && (msg.productCards || []).length === 0

            return (
              <div key={msg.id}>
                {/* Bot message row */}
                {!isUser && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                    <BotAvatar />
                    <div style={{ maxWidth: '78%' }}>
                      {showTyping
                        ? <TypingIndicator />
                        : (
                          <>
                            {msg.content && (
                              <div style={{
                                background: '#F0F0F5',
                                borderRadius: '20px 20px 20px 4px',
                                padding: '13px 16px',
                                fontSize: 14, lineHeight: 1.55,
                                color: '#1A1A2E', fontWeight: 400,
                                whiteSpace: 'pre-wrap',
                              }}>
                                {msg.content}
                                {isStreaming && isLast && (
                                  <span style={{ opacity: 0.5, marginLeft: 2 }}>▌</span>
                                )}
                              </div>
                            )}

                            {/* Product cards horizontal scroll */}
                            {(msg.productCards || []).length > 0 && (
                              <div style={{
                                display: 'flex', gap: 10, overflowX: 'auto',
                                paddingBottom: 4, marginTop: 10,
                                scrollbarWidth: 'none',
                              }}>
                                {msg.productCards!.map((card, i) => (
                                  <ProductCardComponent key={i} card={card} />
                                ))}
                              </div>
                            )}

                            <div style={{ fontSize: 11, color: '#A0A0B0', marginTop: 5, paddingLeft: 4 }}>
                              {formatTime(msg.timestamp)}
                            </div>
                          </>
                        )
                      }
                    </div>
                  </div>
                )}

                {/* User message row */}
                {isUser && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ maxWidth: '78%' }}>
                      <div style={{
                        background: '#1A1A2E',
                        borderRadius: '20px 20px 4px 20px',
                        padding: '13px 16px',
                        fontSize: 14, lineHeight: 1.55,
                        color: '#fff',
                      }}>
                        {msg.content}
                      </div>
                      <div style={{ fontSize: 11, color: '#A0A0B0', marginTop: 5, textAlign: 'right', paddingRight: 4 }}>
                        {formatTime(msg.timestamp)} <span style={{ opacity: 0.6 }}>✓✓</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div style={{
          padding: '10px 16px 6px',
          background: '#fff',
          display: 'flex', gap: 8, overflowX: 'auto',
          borderTop: '1px solid #EBEBF0',
          scrollbarWidth: 'none',
          flexShrink: 0,
        }}>
          {quickActions.map(qa => (
            <QuickActionPill
              key={qa.label}
              icon={qa.icon}
              label={qa.label}
              onClick={() => sendMessage(qa.text)}
            />
          ))}
        </div>

        {/* ── INPUT BAR ── */}
        <div style={{
          padding: '10px 14px 12px',
          background: '#fff',
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0,
        }}>
          <div style={{
            flex: 1,
            display: 'flex', alignItems: 'center',
            background: '#F4F4F8',
            borderRadius: 999,
            padding: '0 16px',
            border: '1.5px solid #EBEBF0',
            transition: 'border-color 0.2s',
          }}>
            {/* Paperclip icon */}
            <button
              title="Attach file"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '0 8px 0 0', color: '#9CA3AF', fontSize: 18, lineHeight: 1,
                display: 'flex', alignItems: 'center',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            <input
              ref={inputRef}
              className="shopify-chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask me anything..."
              disabled={isStreaming}
              maxLength={1000}
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: 14, color: '#1A1A2E',
                padding: '12px 0',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Send button */}
          <button
            className="shopify-send-btn"
            onClick={() => sendMessage()}
            disabled={isStreaming || !input.trim()}
            aria-label="Send message"
            style={{
              width: 44, height: 44,
              borderRadius: '50%',
              background: '#1A1A2E',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          padding: '8px 16px',
          background: '#fff',
          borderTop: '1px solid #EBEBF0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 13 }}>🛡️</span>
            <span style={{ fontSize: 11, color: '#6B7280' }}>Powered by</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#1A73E8' }}>G</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#EA4335' }}>o</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#FBBC05' }}>o</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#34A853' }}>g</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#1A73E8' }}>l</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#EA4335' }}>e</span>
            <span style={{ fontSize: 11, color: '#6B7280', marginLeft: 2 }}>Gemini AI</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11 }}>🔒</span>
            <span style={{ fontSize: 11, color: '#6B7280' }}>Secure & Private</span>
          </div>
        </div>

      </div>
    </>
  )
}
