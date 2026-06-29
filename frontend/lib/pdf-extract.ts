/**
 * Client-side PDF extraction utilities using pdf.js.
 *
 * Strategy:
 *   1. Try text extraction across ALL pages (fast, accurate for digital PDFs).
 *   2. If no text found (scanned PDF), stitch all pages into one JPEG for vision.
 */

async function getPdfjsLib() {
  const pdfjsLib = await import('pdfjs-dist')
  // unpkg worker — cdnjs doesn't host .mjs for this version
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
  return pdfjsLib
}

export type PdfExtractResult =
  | { type: 'text'; text: string }
  | { type: 'image'; file: File }

// Cap scanned pages so the stitched image stays under ~8 MB before JPEG compression
const MAX_SCAN_PAGES = 10
const SCAN_SCALE = 1.2   // lower than before to keep file size down
const JPEG_QUALITY = 0.82

/**
 * Extract content from a PDF file.
 * Returns text if the PDF has selectable text, otherwise a stitched JPEG image.
 */
export async function extractFromPdf(file: File): Promise<PdfExtractResult> {
  const pdfjsLib = await getPdfjsLib()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  // ── Pass 1: try text extraction across all pages ──────────────────────────
  const textParts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim()
    if (pageText) textParts.push(`[Page ${i}]\n${pageText}`)
  }

  const fullText = textParts.join('\n\n')
  // If we have meaningful text (>50 non-whitespace chars) use the text path
  if (fullText.replace(/\s/g, '').length > 50) {
    return { type: 'text', text: fullText }
  }

  // ── Pass 2: scanned PDF — stitch pages into one JPEG ─────────────────────
  const pagesToRender = Math.min(pdf.numPages, MAX_SCAN_PAGES)
  const pageCanvases: HTMLCanvasElement[] = []
  let totalHeight = 0
  let maxWidth = 0

  for (let i = 1; i <= pagesToRender; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: SCAN_SCALE })
    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx, viewport }).promise
    pageCanvases.push(canvas)
    totalHeight += canvas.height
    maxWidth = Math.max(maxWidth, canvas.width)
  }

  const stitched = document.createElement('canvas')
  stitched.width = maxWidth
  stitched.height = totalHeight
  const ctx = stitched.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, maxWidth, totalHeight)

  let y = 0
  for (const c of pageCanvases) {
    ctx.drawImage(c, 0, y)
    y += c.height
  }

  const jpegFile = await new Promise<File>((resolve, reject) => {
    stitched.toBlob(
      (blob) => {
        if (!blob) { reject(new Error('Canvas to JPEG conversion failed')); return }
        resolve(new File([blob], file.name.replace(/\.pdf$/i, '.jpg'), { type: 'image/jpeg' }))
      },
      'image/jpeg',
      JPEG_QUALITY,
    )
  })

  return { type: 'image', file: jpegFile }
}
