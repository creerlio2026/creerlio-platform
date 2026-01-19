import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const resolveLogPath = () => {
  const cwd = process.cwd()
  const candidate = path.resolve(cwd, '.cursor', 'debug.log')
  if (fs.existsSync(path.dirname(candidate))) return candidate
  return path.resolve(cwd, '..', '.cursor', 'debug.log')
}

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const line = `${JSON.stringify(payload)}\n`
    const logPath = resolveLogPath()
    await fs.promises.mkdir(path.dirname(logPath), { recursive: true })
    await fs.promises.appendFile(logPath, line, 'utf8')
  } catch {
    // swallow errors to avoid breaking the UI flow
  }
  return NextResponse.json({ ok: true })
}
