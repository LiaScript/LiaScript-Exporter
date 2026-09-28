/**
 * Conformance test: the same sequence of operations must produce the same
 * observable result on NodeFS and MemoryFS.
 */
import { NodeFS } from '..//node'
import { MemoryFS } from '..//memory'
import { ExportFS } from '..//types'
import { unzipSync } from 'fflate'

let failures = 0
function check(name: string, a: any, b: any) {
  const ja = JSON.stringify(a)
  const jb = JSON.stringify(b)
  if (ja === jb) {
    console.log(`  ok   ${name}: ${ja}`)
  } else {
    failures++
    console.log(`  FAIL ${name}:\n    node=${ja}\n    mem =${jb}`)
  }
}

/** Runs the identical script against one backing, returning observations. */
async function script(fs: ExportFS, base: string) {
  const out: Record<string, any> = {}

  const root = `${base}/proj`
  await fs.ensureDir(root)

  await fs.writeFile(`${root}/index.html`, '<html>hi</html>')
  await fs.writeFile(`${root}/sub/a.txt`, 'alpha')
  await fs.writeFile(`${root}/sub/b.txt`, 'beta')
  await fs.writeFile(`${root}/.hidden/secret.txt`, 'nope')
  await fs.writeFile(`${root}/node_modules/pkg/i.js`, 'nope')
  await fs.writeFileRaw(`${root}/bin.dat`, new Uint8Array([0, 1, 2, 255]))

  out.readFile = await fs.readFile(`${root}/index.html`)
  out.readFileRaw = [...(await fs.readFileRaw(`${root}/bin.dat`))]
  out.size = await fs.size(`${root}/sub/a.txt`)
  out.existsFile = await fs.exists(`${root}/index.html`)
  out.existsMissing = await fs.exists(`${root}/nope.txt`)
  out.existsImplicitDir = await fs.exists(`${root}/sub`)
  out.isDirTrue = await fs.isDirectory(`${root}/sub`)
  out.isDirOnFile = await fs.isDirectory(`${root}/index.html`)
  out.readDirRoot = await fs.readDir(root)
  out.readDirSub = await fs.readDir(`${root}/sub`)

  // ensureDir on an empty dir must remain visible (the `dirs` set case)
  await fs.ensureDir(`${root}/empty`)
  out.emptyDirExists = await fs.exists(`${root}/empty`)
  out.emptyDirIsDir = await fs.isDirectory(`${root}/empty`)

  // copy with the filterHidden-style filter
  const filter = (src: string) =>
    !src
      .slice(root.length)
      .split('/')
      .some((c) => c.startsWith('.') || c === 'node_modules')

  await fs.copy(root, `${base}/copy`, { filter })
  out.copyHasFile = await fs.exists(`${base}/copy/sub/a.txt`)
  out.copySkippedHidden = await fs.exists(`${base}/copy/.hidden/secret.txt`)
  out.copySkippedModules = await fs.exists(`${base}/copy/node_modules/pkg/i.js`)
  out.copyContent = await fs.readFile(`${base}/copy/sub/b.txt`)

  // move
  await fs.move(`${base}/copy/sub`, `${base}/moved`)
  out.moveDest = await fs.readFile(`${base}/moved/a.txt`)
  out.moveSrcGone = await fs.exists(`${base}/copy/sub`)

  // remove
  await fs.remove(`${base}/moved`)
  out.removeGone = await fs.exists(`${base}/moved`)
  out.removeIsRecursive = await fs.exists(`${base}/moved/a.txt`)
  await fs.remove(`${base}/does-not-exist`) // must not throw

  // zip: compare the entry list, not bytes (compressors differ legitimately)
  const zipped = await fs.zip(`${root}/sub`)
  out.zipEntries = Object.keys(unzipSync(zipped)).sort()

  await fs.writeZip(`${root}/sub`, `${base}/archive`)
  out.zipWritten = await fs.exists(`${base}/archive.zip`)

  // error parity
  try {
    await fs.readFile(`${root}/missing.txt`)
    out.readMissing = 'no-throw'
  } catch (e: any) {
    out.readMissing = e.message.includes('ENOENT') ? 'ENOENT' : e.message
  }

  return out
}

async function main() {
  const nodeFS = new NodeFS('/tmp/assets')
  const nodeBase = await nodeFS.tmpDir()
  const nodeOut = await script(nodeFS, nodeBase)

  const memFS = new MemoryFS()
  const memBase = await memFS.tmpDir()
  const memOut = await script(memFS, memBase)

  console.log('\n=== NodeFS vs MemoryFS ===')
  for (const key of Object.keys(nodeOut)) {
    check(key, nodeOut[key], memOut[key])
  }

  console.log(
    failures === 0
      ? '\nALL PASS — backings agree'
      : `\n${failures} DIVERGENCE(S)`,
  )
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
