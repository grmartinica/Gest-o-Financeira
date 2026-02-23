import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center', color: '#b91c1c' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Ocorreu um erro.</h1>
          <p style={{ marginTop: '1rem' }}>Não foi possível carregar o aplicativo. Por favor, tente atualizar a página.</p>
          <pre style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            backgroundColor: '#fee2e2', 
            borderRadius: '8px', 
            color: '#7f1d1d',
            textAlign: 'left',
            fontSize: '0.8rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
