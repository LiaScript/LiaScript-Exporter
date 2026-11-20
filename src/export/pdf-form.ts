'use strict'

/**
 * `--pdf-form`: the quizzes of a PDF as a fillable form, whose check and
 * solution buttons work in readers that run PDF JavaScript (Acrobat, Firefox,
 * …); elsewhere it is still a form to fill in.
 *
 * Chrome prints no form fields. So before printing, {@link markFields} wraps
 * every field and button of the page in a link that names it, and Chrome
 * writes each link with its exact place on its page. {@link addForm} then swaps
 * those links for AcroForm fields, and gives LiaScript's own (drawn) buttons a
 * script that compares with the solutions of the course description (`meta`,
 * see scorm-storage.ts).
 */
import {
  AppearanceProviderFor,
  drawCheckMark,
  drawEllipse,
  PDFArray,
  PDFCheckBox,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFPage,
  PDFRadioGroup,
  PDFString,
  rgb,
  StandardFonts,
} from 'pdf-lib'
import { formScripts, Spec } from './form-scripts'
import type { QuizSpot } from './pdf-form-marks'

export { markFields } from './pdf-form-marks'
export type { QuizSpot }

const LINK = 'https://liaex.invalid/field/'


// Only the mark: LiaScript draws the box. pdf-lib's own looks always stroke a
// border (black unless told otherwise, and width 0 is a hairline in PDF), and
// without one they leave its path open for the mark to paint along.
const MARK = rgb(0.15, 0.15, 0.15)
const checkLook: AppearanceProviderFor<PDFCheckBox> = (_, widget) => {
  const { width, height } = widget.getRectangle()
  const on = drawCheckMark({ x: width / 2, y: height / 2, size: Math.min(width, height) / 2, thickness: 1.5, color: MARK })
  return { normal: { on, off: [] } }
}
const radioLook: AppearanceProviderFor<PDFRadioGroup> = (_, widget) => {
  const { width, height } = widget.getRectangle()
  const r = Math.min(width, height) * 0.22
  const on = drawEllipse({ x: width / 2, y: height / 2, xScale: r, yScale: r, color: MARK, borderColor: undefined, borderWidth: 0 })
  return { normal: { on, off: [] } }
}
type Place = { x: number; y: number; width: number; height: number }

/**
 * Swaps the links {@link markFields} left in a printed PDF for form fields,
 * and gives the quiz buttons their scripts. Null if the PDF has none of these
 * links: printed without them, or by a browser that drops links.
 */
export async function addForm(bytes: Uint8Array): Promise<Uint8Array | null> {
  const pdf = await PDFDocument.load(bytes)
  const form = pdf.getForm()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const groups = new Map<string, PDFRadioGroup>()
  const seen = new Set<number>()

  // `'…Color' in options` decides: undefined is none, LiaScript's field shows through
  const clear = { borderWidth: 0, borderColor: undefined, backgroundColor: undefined }

  const create = (spec: Spec, page: PDFPage, place: Place) => {
    if (spec.kind === 'counter') {
      const [r, g, b] = (spec.color?.match(/[\d.]+/g) || ['0', '0', '0']).map(Number)
      const field = form.createTextField(spec.name)
      field.enableReadOnly()
      field.addToPage(page, { ...place, ...clear, font, textColor: rgb(r / 255, g / 255, b / 255) })
      field.setFontSize(spec.size || 10)
    } else if (spec.kind === 'text' || spec.kind === 'area' || spec.kind === 'feedback') {
      const field = form.createTextField(spec.name)
      if (spec.kind === 'area') field.enableMultiline()
      if (spec.kind === 'feedback') field.enableReadOnly()
      field.addToPage(page, { ...place, ...clear, font })
      field.setFontSize(spec.kind === 'feedback' ? 10 : 11)
    } else if (spec.kind === 'check') {
      const field = form.createCheckBox(spec.name)
      field.addToPage(page, { ...place, ...clear })
      field.updateAppearances(checkLook)
    } else if (spec.kind === 'radio') {
      const group = groups.get(spec.name) ?? form.createRadioGroup(spec.name)
      groups.set(spec.name, group)
      group.addOptionToPage(spec.value!, page, { ...place, ...clear })
      group.updateAppearances(radioLook)
    } else if (spec.kind === 'select') {
      const field = form.createDropdown(spec.name)
      const blank = spec.placeholder || '–'
      field.addOptions([blank, ...spec.options!])
      field.select(blank)
      field.addToPage(page, { ...place, font, borderWidth: 0, borderColor: undefined })
      field.setFontSize(11)
      try {
        // Helvetica knows Latin-1 only: an option it cannot write keeps the drawn field
        field.updateAppearances(font)
      } catch (e) {
        form.removeField(field)
        throw e
      }
    } else if (spec.kind === 'button') {
      const button = form.createButton(spec.name)
      button.addToPage('', page, { ...place, borderWidth: 0 })
      // pdf-lib paints buttons grey; LiaScript's drawn button stays visible
      button.acroField.getWidgets()[0].getAppearanceCharacteristics()?.dict.delete(PDFName.of('BG'))
      button.updateAppearances(font)
    }
  }

  const found: { spec: Spec; page: PDFPage; place: Place }[] = []
  for (const page of pdf.getPages()) {
    const annots = page.node.Annots()
    if (!annots) continue

    for (let i = annots.size() - 1; i >= 0; i--) {
      const annot = annots.lookup(i)
      if (!(annot instanceof PDFDict)) continue
      const uri = annot.lookupMaybe(PDFName.of('A'), PDFDict)?.lookup(PDFName.of('URI'))
      const text = uri instanceof PDFString || uri instanceof PDFHexString ? uri.decodeText() : ''
      if (!text.startsWith(LINK)) continue

      annots.remove(i)
      const spec: Spec = JSON.parse(decodeURIComponent(text.slice(LINK.length)))
      // a link broken over two lines or pages comes twice
      if (seen.has(spec.id)) continue
      seen.add(spec.id)

      const [x1, y1, x2, y2] = annot.lookup(PDFName.of('Rect'), PDFArray).asArray().map((n) => (n as PDFNumber).asNumber())
      found.push({ spec, page, place: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 } })
    }
  }

  if (!found.length) return null

  // in the order of the page, which is the order of the tab key
  for (const { spec, page, place } of found.sort((a, b) => a.spec.id - b.spec.id)) {
    try {
      create(spec, page, place)
    } catch (e) {
      console.warn(`pdf-form: field ${spec.name} left out (${(e as Error).message})`)
    }
  }

  for (const { spot, check, resolve } of formScripts(found.map(({ spec }) => spec))) {
    for (const [button, js] of [
      [spot.check, check],
      [spot.resolve, resolve],
    ]) {
      if (!button || !js) continue
      const field = form.getFieldMaybe(button)
      field?.acroField.getWidgets()[0].dict.set(
        PDFName.of('A'),
        pdf.context.obj({ Type: 'Action', S: 'JavaScript', JS: PDFHexString.fromText(js) }),
      )
    }
  }

  // every field got its look when it was made; the defaults would draw borders again
  return pdf.save({ updateFieldAppearances: false })
}

