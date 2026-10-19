// Prepara a pasta de fotos (UPLOADS_DIR): cria se faltar e grava o marcador que prova que é o volume certo.
// Rode uma vez por servidor/volume: npm run uploads:init
import 'dotenv/config'
import { getUploadsDir, initUploadsDir } from '../lib/uploads/storage'

async function main() {
  const dir = getUploadsDir()
  const root = await initUploadsDir(dir)
  console.log(`Pasta de fotos pronta: ${root}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
