// Usado antes dos comandos do Prisma CLI nos scripts do package.json: tsx scripts/require-local-db.ts <nome>
import { assertLocalDatabase } from './local-db-guard'

assertLocalDatabase(process.argv[2] ?? 'comando')
