import React from 'react'
import type { ProductCard as ProductCardType } from '../types'

interface Props {
  card: ProductCardType
}

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="90" viewBox="0 0 120 90"%3E%3Crect width="120" height="90" fill="%23E5E7EB"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="11" fill="%239CA3AF"%3ENo image%3C/text%3E%3C/svg%3E'

export function ProductCardComponent({ card }: Props) {
  return (
    <a
      href={card.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 140,
        minWidth: 140,
        borderRadius: 14,
        border: '1.5px solid #E5E7EB',
        background: '#fff',
        textDecoration: 'none',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, transform 0.15s',
        cursor: 'pointer',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.boxShadow = 'none'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Product image */}
      <div style={{
        width: '100%', height: 90,
        background: '#F3F4F6',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <img
          src={card.image_url || PLACEHOLDER}
          alt={card.title}
          onError={e => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER }}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* Availability badge */}
        <div style={{
          position: 'absolute', top: 6, right: 6,
          background: card.availability === 'In Stock' ? '#D1FAE5' : '#FEE2E2',
          color: card.availability === 'In Stock' ? '#065F46' : '#991B1B',
          fontSize: 9, fontWeight: 700, padding: '2px 6px',
          borderRadius: 999, letterSpacing: '0.3px',
          textTransform: 'uppercase',
        }}>
          {card.availability === 'In Stock' ? 'In Stock' : 'Out'}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '10px 10px 8px' }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: '#1A1A2E',
          lineHeight: 1.35, marginBottom: 6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {card.title}
        </div>

        {/* Price + arrow row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E' }}>
            {card.price}
          </span>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            border: '1.5px solid #E5E7EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#1A1A2E" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </a>
  )
}
