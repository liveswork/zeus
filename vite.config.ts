import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    // 🚀 Otimizações específicas do React
    babel: {
      plugins: [
        // Remove console.log em produção
        process.env.NODE_ENV === 'production' && 
        ['transform-remove-console', { exclude: ['error', 'warn'] }]
      ].filter(Boolean)
    }
  })],
  
  base: './',
  
  // 🔧 Configurações do servidor de desenvolvimento
  server: {
    port: 5173,
    host: true, // Permite acesso em rede local
    hmr: {
      // Reduz warnings no overlay
      overlay: {
        warnings: false,
        errors: true
      }
    },
    watch: {
      // Ignora mudanças em arquivos desnecessários
      ignored: ['**/node_modules/**', '**/.git/**']
    }
  },
  
  // 📦 Configurações de build
  build: {
    target: 'es2020',
    minify: 'esbuild', // Mais rápido que terser
    sourcemap: process.env.NODE_ENV !== 'production', // Sourcemaps apenas em dev
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignora warnings específicos que não são problemas
        const ignoredWarnings = [
          'baseline-browser-mapping',
          'Autofill.enable',
          'Autofill.setAddresses',
          'SOURCEMAP_ERROR',
          'THIS_IS_UNDEFINED',
          'CIRCULAR_DEPENDENCY'
        ]
        
        if (ignoredWarnings.some(msg => warning.message?.includes(msg))) {
          return
        }
        
        // Para outros warnings, mostra normalmente
        warn(warning)
      },
      output: {
        // Divide vendor chunks para melhor caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ui-vendor': ['lucide-react', 'class-variance-authority', 'clsx', 'tailwind-merge']
        }
      }
    },
    // Otimizações para Electron se for o caso
    outDir: 'dist',
    emptyOutDir: true,
    // Aumenta limite de tamanho de warning
    chunkSizeWarningLimit: 1000
  },
  
  // 🎯 Configurações de preview (build preview)
  preview: {
    port: 4173,
    host: true
  },
  
  // 🔍 Resolve aliases para paths absolutos
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@contexts': path.resolve(__dirname, 'src/contexts'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@assets': path.resolve(__dirname, 'src/assets')
    }
  },

  
  // 📝 Define variáveis de ambiente
  define: {
    // Define se está em modo desenvolvimento
    __DEV__: process.env.NODE_ENV !== 'production',
    // Define versão da aplicação
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  },
  
  // 🛠️ Configuração específica para Electron se necessário
  ...(process.env.ELECTRON === 'true' ? {
    base: './',
    build: {
      outDir: 'dist-electron',
      // Configurações específicas para Electron
      rollupOptions: {
        external: ['electron']
      }
    }
  } : {})
})