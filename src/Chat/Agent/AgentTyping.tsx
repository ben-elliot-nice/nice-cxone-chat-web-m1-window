import React from 'react';

export function AgentTyping(): JSX.Element {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-start',
      padding: '8px 12px'
    }}>
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 12px',
        backgroundColor: 'white',
        borderRadius: '0 18px 18px 18px',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
        minWidth: '50px'
      }}>
        <div style={{ display: 'flex', gap: '3px' }}>
          <div style={{
            width: '6px',
            height: '6px',
            backgroundColor: '#666',
            borderRadius: '50%',
            animation: 'typing-dot 1.4s infinite both',
            animationDelay: '0s'
          }}></div>
          <div style={{
            width: '6px',
            height: '6px',
            backgroundColor: '#666',
            borderRadius: '50%',
            animation: 'typing-dot 1.4s infinite both',
            animationDelay: '0.2s'
          }}></div>
          <div style={{
            width: '6px',
            height: '6px',
            backgroundColor: '#666',
            borderRadius: '50%',
            animation: 'typing-dot 1.4s infinite both',
            animationDelay: '0.4s'
          }}></div>
        </div>
      </div>
      <style jsx>{`
        @keyframes typing-dot {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
