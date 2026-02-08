import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class CrashBoundary extends React.Component<Props, State> {

  state: State = {
    hasError: false
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {

    // 🔥 Aqui você pluga Telemetry futuramente
    console.error('🔥 CRASH DETECTADO');
    console.error(error);
    console.error(info.componentStack);

    /**
     * FUTURO:
     * telemetryService.captureCrash(error, info)
     */
  }

  handleRestart = () => {
    window.location.reload();
  };

  render() {

    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          background: '#0f172a',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui'
        }}>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>
            O sistema encontrou um erro inesperado.
          </h1>

          <p style={{ opacity: 0.7, marginBottom: 24 }}>
            Reinicie a aplicação.
          </p>

          <button
            onClick={this.handleRestart}
            style={{
              padding: '12px 20px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Reiniciar Sistema
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
