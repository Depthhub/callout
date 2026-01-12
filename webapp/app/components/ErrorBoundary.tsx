'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in child component tree,
 * logs the error, and displays a fallback UI.
 * 
 * SECURITY: Error messages shown to users are sanitized.
 * Full error details are only logged in development.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // SECURITY: Only log full errors in development
    // In production, send to error monitoring service with sanitized data
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught an error:', error)
      console.error('Component stack:', errorInfo.componentStack)
    }
    
    // In production, you would send to an error monitoring service here:
    // logErrorToService(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <div className="error-boundary__icon">
              <AlertTriangle size={48} color="var(--error)" />
            </div>
            <h2 className="error-boundary__title">Something went wrong</h2>
            <p className="error-boundary__message">
              We encountered an unexpected error. Please try again.
            </p>
            <button
              className="btn btn-primary btn-press"
              onClick={this.handleRetry}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>

          <style jsx>{`
            .error-boundary {
              min-height: 300px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 40px 20px;
            }
            .error-boundary__content {
              text-align: center;
              max-width: 400px;
            }
            .error-boundary__icon {
              margin-bottom: 20px;
            }
            .error-boundary__title {
              font-size: 20px;
              font-weight: 700;
              margin-bottom: 8px;
              color: var(--text-primary);
            }
            .error-boundary__message {
              color: var(--text-secondary);
              margin-bottom: 24px;
              font-size: 14px;
            }
          `}</style>
        </div>
      )
    }

    return this.props.children
  }
}

