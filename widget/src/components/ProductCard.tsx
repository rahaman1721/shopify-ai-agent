import React from 'react'
import type { ProductCard as ProductCardType } from '../types'

interface Props {
  card: ProductCardType
}

export function ProductCardComponent({ card }: Props) {
  // If card has handle matching pegboards or placeholder, use exact cropped assets
  let imgSrc = card.image_url || '/product_pegboard_1.png'
  if (card.handle?.includes('kit') || card.title?.toLowerCase().includes('kit')) {
    imgSrc = card.image_url || '/product_pegboard_2.png'
  } else if (card.handle?.includes('panel') || card.title?.toLowerCase().includes('panel')) {
    imgSrc = card.image_url || '/product_pegboard_3.png'
  }

  return (
    <div className="w-[126px] shrink-0 bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-md transition-shadow select-none">
      <div className="h-[88px] bg-white overflow-hidden">
        <img
          src={imgSrc}
          alt={card.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).src = '/product_pegboard_1.png'
          }}
        />
      </div>
      <div className="p-2 flex flex-col justify-between">
        <h4 className="text-[11.5px] font-medium text-[#1E232A] leading-tight min-h-[28px] line-clamp-2">
          {card.title}
        </h4>
        <div className="flex items-center justify-between mt-2 pt-1">
          <span className="text-[13px] font-bold text-[#1E232A]">{card.price}</span>
          <a
            href={card.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="w-5 h-5 rounded-full bg-[#F3F4F6] hover:bg-[#1E1F2E] hover:text-white text-[#1E232A] flex items-center justify-center text-[10px] transition-colors"
          >
            →
          </a>
        </div>
      </div>
    </div>
  )
}
