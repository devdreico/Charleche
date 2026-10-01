import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const OUT = path.resolve('public')
const SRC = path.resolve('charlotte.jpg')

const bottle = `
  <g fill="#ffffff">
    <path d="M226 96h60a16 16 0 0 1 16 16v22h-92v-22a16 16 0 0 1 16-16z"/>
    <rect x="204" y="140" width="104" height="26" rx="13"/>
    <path d="M188 186h136a30 30 0 0 1 30 30v152a46 46 0 0 1-46 46H204a46 46 0 0 1-46-46V216a30 30 0 0 1 30-30z"/>
  </g>
  <path d="M158 316h196v52a46 46 0 0 1-46 46H204a46 46 0 0 1-46-46z" fill="#f2568b" opacity="0.55"/>
  <rect x="196" y="214" width="20" height="66" rx="10" fill="#ffffff" opacity="0.65"/>
`

function iconSvg({ size, maskable }) {
  const scale = maskable ? 0.72 : 1
  const content = `
    <g transform="translate(${(512 * (1 - scale)) / 2} ${(512 * (1 - scale)) / 2}) scale(${scale})">
      ${bottle}
    </g>`
  const bg = maskable
    ? `<rect width="512" height="512" fill="url(#g)"/>`
    : `<rect width="512" height="512" rx="118" fill="url(#g)"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffa4c2"/>
        <stop offset="52%" stop-color="#f2568b"/>
        <stop offset="100%" stop-color="#ff9e7e"/>
      </linearGradient>
      <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.34"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${bg}
    ${maskable ? '' : `<rect width="512" height="512" rx="118" fill="url(#s)"/>`}
    ${content}
  </svg>`
}

async function png(svg, file) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(OUT, file))
  console.log('✓', file)
}

async function main() {
  await mkdir(OUT, { recursive: true })
  await png(iconSvg({ size: 192, maskable: false }), 'icon-192.png')
  await png(iconSvg({ size: 512, maskable: false }), 'icon-512.png')
  await png(iconSvg({ size: 512, maskable: true }), 'icon-maskable-512.png')

  const src = SRC
  const meta = await sharp(src).metadata()
  const side = Math.round(Math.min(meta.width, meta.height) * 0.48)
  const cx = Math.round(meta.width * 0.16)
  const cy = Math.round(meta.height * 0.53)
  const left = Math.max(0, Math.min(meta.width - side, cx - side / 2))
  const top = Math.max(0, Math.min(meta.height - side, cy - side / 2))
  await sharp(src)
    .extract({ left: Math.round(left), top: Math.round(top), width: side, height: side })
    .resize(1080, 1080)
    .webp({ quality: 84 })
    .toFile(path.join(OUT, 'charlotte-small.webp'))
  console.log('✓ charlotte-small.webp', `${meta.width}x${meta.height} → crop ${side}px @ ${left},${top}`)

  await sharp(src)
    .resize({ width: 1200 })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(path.join(OUT, 'charlotte-share.jpg'))
  console.log('✓ charlotte-share.jpg')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
