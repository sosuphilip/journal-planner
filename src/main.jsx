import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/* ── Error Boundary — prevents white-screen crashes ────── */
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 500, margin: '40px auto' }}>
          <h2>Something went wrong</h2>
          <p style={{ color: '#666' }}>{this.state.error.message}</p>
          <button onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{ padding: '8px 16px', cursor: 'pointer', marginTop: 12 }}>
            Reload app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
