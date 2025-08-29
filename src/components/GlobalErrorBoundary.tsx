import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Error500 } from './Error500'

type Props = { children: ReactNode }
type State = { hasError: boolean; error?: unknown }

export class GlobalErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('GlobalErrorBoundary caught an error', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
    // Let consumers decide what to do; default to reload
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const message = this.state.error instanceof Error ? this.state.error.message : undefined
      return <Error500 message={message} onRetry={this.handleRetry} />
    }
    return this.props.children
  }
} 