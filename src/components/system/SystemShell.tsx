import { useAuth } from '../../contexts/AuthContext';
import { BootScreen } from './BootScreen';

// Apps reais
import { AppRouter } from '../routing/AppRouter';
import { Login } from '../auth/Login';

export function SystemShell() {
  const { ready, authMode } = useAuth();

  if (!ready) {
    return <BootScreen message="Inicializando Sistema..." />;
  }

  if (authMode === 'ANONYMOUS') {
    return <Login />;
  }

  return <AppRouter />;
}
