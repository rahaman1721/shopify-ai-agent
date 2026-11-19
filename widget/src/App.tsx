import React, { useState, useCallback } from 'react';
import ChatWindow from './components/ChatWindow';

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setHasUnread(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleNewMessage = useCallback(() => {
    if (!isOpen) setHasUnread(true);
  }, [isOpen]);

  return (
    <>
      {/* Chat Window Overlay */}
      <div
        className={`fixed bottom-24 right-6 z-[9999] transition-all duration-300 ease-in-out ${
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
        aria-hidden={!isOpen}
      >
        <ChatWindow onClose={handleClose} onNewMessage={handleNewMessage} />
      </div>

      {/* Floating Toggle Button */}
      <button
        onClick={isOpen ? handleClose : handleOpen}
        aria-label={isOpen ? 'Close shopping assistant' : 'Open shopping assistant'}
        className={`
          fixed bottom-6 right-6 z-[9999]
          w-14 h-14 rounded-full shadow-2xl
          flex items-center justify-center
          bg-gradient-to-br from-[#008060] to-[#004c3f]
          text-white
          transition-all duration-200 ease-in-out
          hover:scale-110 hover:shadow-[0_8px_30px_rgba(0,128,96,0.5)]
          active:scale-95
          focus:outline-none focus:ring-2 focus:ring-[#008060] focus:ring-offset-2
        `}
      >
        {/* Unread badge */}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}

        {/* Icon morphs: chat ↔ X */}
        <span className={`absolute transition-all duration-200 ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-75'}`}>
          {/* X close icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
        <span className={`absolute transition-all duration-200 ${!isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}`}>
          {/* Chat bubble icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </span>
      </button>
    </>
  );
}
