export function hasMaxLinesDisable(source) {
  const pattern = /(?:eslint|oxlint)-disable(?:-next-line|-line)?\b([^\n]*)/g
  let match
  while ((match = pattern.exec(source)) !== null) {
    const rules = match[1].split('--')[0].split('*/')[0]
    if (/\bmax-lines\b/.test(rules)) return true
  }
  return false
}
