import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    // Expõe ao app variáveis com prefixo VITE_ e também NEXT_PUBLIC_ (alias),
    // permitindo usar os nomes do Supabase tanto em .env Vite quanto Next.js.
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    resolve: {
      alias: {
        // `__dirname` não existe quando o Vite carrega a config como módulo ES
        // nativo (padrão a partir do Vite 8). `import.meta.dirname` funciona nos
        // dois modos, então é ele que mantém o alias '@/...' resolvendo.
        '@': path.resolve(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
