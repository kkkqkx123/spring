import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer plugin (only in analyze mode)
    ...(process.env.ANALYZE ? [visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })] : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },
  build: {
    // Enable source maps for better debugging
    sourcemap: true,
    
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mantine': [
            '@mantine/core', 
            '@mantine/hooks', 
            '@mantine/notifications',
            '@mantine/form'
          ],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-icons': ['@tabler/icons-react'],
          'vendor-utils': ['axios', 'zustand', 'socket.io-client'],
          
          // Feature chunks
          'feature-auth': [
            './src/features/auth/index.ts',
            './src/features/auth/components/LoginForm.tsx',
            './src/features/auth/components/RegisterForm.tsx',
            './src/features/auth/pages/LoginPage.tsx',
            './src/features/auth/pages/RegisterPage.tsx',
          ],
          'feature-employees': [
            './src/features/employees/index.ts',
          ],
          'feature-departments': [
            './src/features/departments/index.ts',
          ],
          'feature-chat': [
            './src/features/chat/index.ts',
          ],
          'feature-email': [
            './src/features/email/index.ts',
          ],
          'feature-notifications': [
            './src/features/notifications/index.ts',
          ],
          'feature-permissions': [
            './src/features/permissions/index.ts',
          ],
        },
        
        // Naming pattern for chunks
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        
        // Asset naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `img/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext || '')) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    
    // Minification options
    minify: 'esbuild',
    target: 'es2020',
  },
  
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mantine/core',
      '@mantine/hooks',
      '@mantine/notifications',
      '@mantine/form',
      '@tanstack/react-query',
      '@tabler/icons-react',
      'axios',
      'zustand',
      'socket.io-client',
    ],
  },
})
