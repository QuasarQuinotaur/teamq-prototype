import React from 'react';
import { ErrorBoundary } from "react-error-boundary";
import Grainient from '@/components/Grainient';

// 1. The Custom Error UI
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      {/* Background Component */}
      <div style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
        <Grainient
          grainAmount={0.15} 
          color1="#232d49" 
          color2="#4a148c" 
          color3="#fea6ff" 
        />
      </div>

      {/* Content */}
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem', 
        background: 'rgba(0,0,0,0.3)', 
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        maxWidth: '80%'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>it 💩 itself, lock in:</h1>
        <p style={{ 
          fontSize: '1.2rem', 
          opacity: 0.8, 
          backgroundColor: 'rgba(255, 255, 255, 0.2)', 
          padding: '10px', 
          borderRadius: '8px',
          fontFamily: 'monospace'
        }}>
          {error.message}
        </p>
        <button 
          onClick={resetErrorBoundary}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            cursor: 'pointer',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 'bold'
          }}
        >
          Try to Recover
        </button>
      </div>
    </div>
  );
}

// 2. The Wrapper Component
export default function ErrorWrapper({ children }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}