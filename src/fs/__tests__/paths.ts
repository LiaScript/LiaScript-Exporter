/** The POSIX path helpers must agree with Node's path.posix on real inputs. */
import * as nodePath from 'path'
import * as p from '..//path'

let failures = 0
function eq(label: string, mine: string, theirs: string) {
  if (mine === theirs) return
  failures++
  console.log(`  FAIL ${label}\n    mine=${JSON.stringify(mine)}\n    node=${JSON.stringify(theirs)}`)
}

const paths = [
  'index.html', './index.html', 'sub/a.txt', '/tmp/lia/proj/index.html',
  'a/b/../c.txt', '/a/b/../../c', 'dist/assets/web', '.hidden/x',
  'archive.zip', 'README.md', 'a/b/c/d.tar.gz', '/root', 'x/',
]

for (const a of paths) {
  eq(`normalize(${a})`, p.normalize(a), nodePath.posix.normalize(a).replace(/\/$/, '') || '/')
  eq(`dirname(${a})`, p.dirname(a), nodePath.posix.dirname(a))
  eq(`basename(${a})`, p.basename(a), nodePath.posix.basename(a))
  eq(`extname(${a})`, p.extname(a), nodePath.posix.extname(a))

  for (const b of paths) {
    eq(`join(${a},${b})`, p.join(a, b), nodePath.posix.join(a, b).replace(/\/$/, '') || '/')
    if (a.startsWith('/') && b.startsWith('/')) {
      eq(`relative(${a},${b})`, p.relative(a, b), nodePath.posix.relative(a, b))
    }
  }
}

// basename with an extension stripped, as scorm/web use it
eq('basename(README.md,.md)', p.basename('README.md', '.md'), nodePath.posix.basename('README.md', '.md'))
eq('basename(a/b.html,.html)', p.basename('a/b.html', '.html'), nodePath.posix.basename('a/b.html', '.html'))

console.log(failures === 0 ? 'PATHS: ALL PASS' : `PATHS: ${failures} failures`)
process.exit(failures === 0 ? 0 : 1)
