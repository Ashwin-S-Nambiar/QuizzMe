import { copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const notFoundPage = () => {
  let outDir;
  return {
    name: 'not-found-page',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      await copyFile(
        resolve(outDir, 'index.html'),
        resolve(outDir, '404.html'),
      );
    },
  };
};

const iconWeights = (keep) => ({
  name: 'icon-weights',
  enforce: 'pre',
  transform(code, id) {
    if (!id.includes('@phosphor-icons/react/dist/defs/')) return;
    return code.replace(
      /\n {2}\[\n {4}"(\w+)",[\s\S]*?\n {2}\],?/g,
      (entry, weight) => (keep.includes(weight) ? entry : ''),
    );
  },
});

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    notFoundPage(),
    iconWeights(['bold', 'duotone', 'fill']),
  ],
});
