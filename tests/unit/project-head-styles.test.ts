/*
 * `headStyles` (src/export/project.ts): `link:` and `style:` of a project.yaml
 * become <head> markup, and local stylesheets are copied next to the page.
 */
import { describe, expect, it } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { headStyles } from '../../src/export/project'

function folders() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lia-head-test-'))
  const src = path.join(root, 'src')
  const out = path.join(root, 'out')
  fs.mkdirSync(path.join(src, 'site'), { recursive: true })
  fs.mkdirSync(out)
  fs.writeFileSync(path.join(src, 'theme.css'), 'body { color: red }')
  fs.writeFileSync(path.join(src, 'site', 'extra.css'), 'h1 { color: blue }')
  return {
    root,
    yaml: path.join(src, 'project.yaml'),
    page: path.join(out, 'index'),
    out,
  }
}

describe('headStyles', () => {
  it('links URLs and local files in order, then the inline style', () => {
    const f = folders()
    const html = headStyles(
      {
        link: ['https://fonts.example.org/font.css', 'theme.css'],
        style: ':root { --accent: #003366; }',
      },
      f.yaml,
      f.page,
    )
    const font = html.indexOf('https://fonts.example.org/font.css')
    const theme = html.indexOf('href="theme.css"')
    const style = html.indexOf('<style>')
    expect(font).toBeGreaterThanOrEqual(0)
    expect(theme).toBeGreaterThan(font)
    expect(style).toBeGreaterThan(theme)
    expect(html).toContain(':root { --accent: #003366; }')
  })

  it('copies local stylesheets next to the page, keeping sub-folders', () => {
    const f = folders()
    headStyles({ link: ['theme.css', 'site/extra.css'] }, f.yaml, f.page)
    expect(fs.readFileSync(path.join(f.out, 'theme.css'), 'utf8')).toBe(
      'body { color: red }',
    )
    expect(fs.existsSync(path.join(f.out, 'site', 'extra.css'))).toBe(true)
  })

  it('accepts a single link as a string', () => {
    const f = folders()
    expect(headStyles({ link: 'theme.css' }, f.yaml, f.page)).toContain(
      '<link rel="stylesheet" href="theme.css">',
    )
  })

  it('does not copy files outside the folder of project.yaml', () => {
    const f = folders()
    fs.writeFileSync(path.join(f.root, 'outside.css'), 'x')
    const html = headStyles({ link: '../outside.css' }, f.yaml, f.page)
    expect(html).toContain('href="../outside.css"')
    expect(fs.existsSync(path.join(f.root, 'outside.css'))).toBe(true)
    expect(fs.readdirSync(f.out)).toEqual([])
  })

  it('works when the page is written next to project.yaml', () => {
    const f = folders()
    const html = headStyles(
      { link: 'theme.css' },
      f.yaml,
      path.join(path.dirname(f.yaml), 'index'),
    )
    expect(html).toContain('href="theme.css"')
  })

  it('returns nothing without link and style', () => {
    const f = folders()
    expect(headStyles({}, f.yaml, f.page)).toBe('')
  })
})
