import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Without a boundary, any throw during render or in an effect unmounts the whole
 * tree and leaves a blank page with no explanation.
 *
 * Must be a class: there is no hook equivalent of componentDidCatch.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div role="alert" style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: '1.25rem' }}>Something went wrong</h1>
        <p>The drill hit an unexpected error and stopped.</p>
        <pre style={{ whiteSpace: 'pre-wrap', opacity: 0.75, fontSize: '0.8rem' }}>
          {error.message}
        </pre>
        <button type="button" onClick={this.handleReset} style={{ padding: '0.5rem 1rem' }}>
          Try again
        </button>
      </div>
    );
  }
}
