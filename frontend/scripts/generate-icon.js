#!/usr/bin/env node
// Genera build/icon.png y build/icon.ico a partir de build/icon.svg
// Ejecutar una vez antes de npm run dist: node scripts/generate-icon.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SVG_PATH = path.join(ROOT, 'build', 'icon.svg');
const PNG_PATH = path.join(ROOT, 'build', 'icon.png');
const ICO_PATH = path.join(ROOT, 'build', 'icon.ico');

async function main() {
  console.log('Generando iconos de la app...');

  const svgData = fs.readFileSync(SVG_PATH);

  // SVG → PNG (512×512)
  const { Resvg } = require('@resvg/resvg-js');
  const resvg = new Resvg(svgData, { fitTo: { mode: 'width', value: 512 } });
  const rendered = resvg.render();
  const png512 = rendered.asPng();
  fs.writeFileSync(PNG_PATH, png512);
  console.log('✓ build/icon.png (512×512)');

  // PNG → ICO con múltiples tamaños (16, 32, 48, 256)
  const pngToIco = require('png-to-ico');
  const sizes = [16, 32, 48, 256];
  const pngBuffers = await Promise.all(
    sizes.map(async (size) => {
      const r = new Resvg(svgData, { fitTo: { mode: 'width', value: size } });
      return r.render().asPng();
    })
  );
  const ico = await pngToIco(pngBuffers);
  fs.writeFileSync(ICO_PATH, ico);
  console.log('✓ build/icon.ico (16, 32, 48, 256 px)');

  console.log('\nListo. Ahora podés correr: npm run dist');
}

main().catch((err) => {
  console.error('Error:', err.message);
  console.error('Instalá las dependencias con: npm install');
  process.exit(1);
});
