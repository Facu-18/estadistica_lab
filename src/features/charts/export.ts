export async function exportChart(container: HTMLElement, filename: string, lines: string[] = []): Promise<void> {
  const source = container.querySelector('svg.recharts-surface') as SVGSVGElement | null
  if (!source) throw new Error('El gráfico todavía no está listo. Intentá nuevamente.')
  const rect = source.getBoundingClientRect()
  if (!rect.width || !rect.height) throw new Error('El gráfico debe estar visible para exportarlo.')
  const clone = source.cloneNode(true) as SVGSVGElement
  const originals = [source, ...source.querySelectorAll('*')]
  const copies = [clone, ...clone.querySelectorAll('*')]
  originals.forEach((original, i) => {
    const style = getComputedStyle(original)
    for (const property of ['fill', 'stroke', 'color', 'font-family', 'font-size', 'font-weight']) {
      (copies[i] as SVGElement).style.setProperty(property, style.getPropertyValue(property))
    }
  })
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(rect.width))
  clone.setAttribute('height', String(rect.height))
  const svgUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' }))
  let pngUrl: string | undefined
  try {
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('No se pudo preparar la imagen del gráfico.'))
      image.src = svgUrl
    })
    const canvas = document.createElement('canvas')
    const scale = 2
    canvas.width = Math.ceil(rect.width * scale)
    canvas.height = Math.ceil((rect.height + 50 + lines.length * 22) * scale)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Tu navegador no permite exportar imágenes.')
    context.scale(scale, scale)
    context.fillStyle = getComputedStyle(container).getPropertyValue('--card').trim() || '#ffffff'
    context.fillRect(0, 0, canvas.width / scale, canvas.height / scale)
    context.drawImage(image, 0, 0)
    context.fillStyle = getComputedStyle(container).color
    context.font = '13px system-ui, sans-serif'
    context.fillText('Estadística Lab · IEFI', 20, rect.height + 28)
    lines.forEach((line, i) => context.fillText(line, 20, rect.height + 50 + i * 22, rect.width - 40))
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('No se pudo crear el PNG.')), 'image/png'))
    pngUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = pngUrl
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()
  } finally {
    URL.revokeObjectURL(svgUrl)
    if (pngUrl) setTimeout(() => URL.revokeObjectURL(pngUrl!), 1000)
  }
}
