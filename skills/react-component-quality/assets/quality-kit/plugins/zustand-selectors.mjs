const ALLOCATING_METHODS = new Set(['filter', 'flat', 'flatMap', 'map', 'toReversed', 'toSorted', 'toSpliced', 'with'])

function identifierName(node) {
  return node?.type === 'Identifier' ? node.name : null
}

function propertyName(node) {
  if (node?.type !== 'MemberExpression') return null
  if (!node.computed) return identifierName(node.property)
  return node.property?.type === 'Literal' && typeof node.property.value === 'string' ? node.property.value : null
}

function returnedExpressions(selector) {
  if (!['ArrowFunctionExpression', 'FunctionExpression'].includes(selector?.type)) return []
  if (selector.body.type !== 'BlockStatement') return [selector.body]
  const expressions = []
  const visit = (node) => {
    if (!node || typeof node !== 'object') return
    if (node !== selector.body && ['ArrowFunctionExpression', 'FunctionDeclaration', 'FunctionExpression'].includes(node.type)) return
    if (node.type === 'ReturnStatement') {
      if (node.argument) expressions.push(node.argument)
      return
    }
    for (const [key, child] of Object.entries(node)) {
      if (key === 'parent') continue
      if (Array.isArray(child)) child.forEach(visit)
      else visit(child)
    }
  }
  visit(selector.body)
  return expressions
}

function isAllocating(expression) {
  if (['ArrayExpression', 'ObjectExpression', 'NewExpression'].includes(expression?.type)) return true
  if (expression?.type === 'ConditionalExpression') return isAllocating(expression.consequent) || isAllocating(expression.alternate)
  if (expression?.type === 'LogicalExpression') return isAllocating(expression.left) || isAllocating(expression.right)
  if (expression?.type !== 'CallExpression') return false
  const method = propertyName(expression.callee)
  return ALLOCATING_METHODS.has(method) || (identifierName(expression.callee.object) === 'Object' && ['assign', 'entries', 'fromEntries', 'keys', 'values'].includes(method))
}

function createState() {
  return { storeHooks: new Set(), shallowHooks: new Set() }
}

function recordImports(node, state) {
  for (const specifier of node.specifiers) {
    const local = identifierName(specifier.local)
    if (!local) continue
    if (/^use[A-Z].*Store$/.test(local)) state.storeHooks.add(local)
    if (node.source?.value === 'zustand/react/shallow' && identifierName(specifier.imported) === 'useShallow') state.shallowHooks.add(local)
  }
}

function storeCall(node, state) {
  return node.callee.type === 'Identifier' && state.storeHooks.has(node.callee.name)
}

function unwrap(selector, state) {
  if (selector?.type === 'CallExpression' && selector.callee.type === 'Identifier' && state.shallowHooks.has(selector.callee.name)) {
    return { selector: selector.arguments[0], shallow: true }
  }
  return { selector, shallow: false }
}

function bind(createVisitors) {
  return (context) => {
    const visitors = createVisitors()
    for (const [type, visitor] of Object.entries(visitors)) visitors[type] = visitor.bind(context)
    return visitors
  }
}

function requireSelector() {
  const state = createState()
  return {
    ImportDeclaration(node) { recordImports(node, state) },
    CallExpression(node) {
      if (storeCall(node, state) && node.arguments.length === 0) this.report({ node, message: 'Pass a focused selector instead of subscribing to the whole Zustand store.' })
    },
  }
}

function noFreshSelectorResult() {
  const state = createState()
  return {
    ImportDeclaration(node) { recordImports(node, state) },
    CallExpression(node) {
      if (!storeCall(node, state)) return
      const { selector, shallow } = unwrap(node.arguments[0], state)
      if (shallow) return
      const fresh = returnedExpressions(selector).find(isAllocating)
      if (fresh) this.report({ node: fresh, message: 'Selector returns a fresh reference; select a stable field, memoize, or wrap with useShallow.' })
    },
  }
}

export default {
  meta: { name: 'zustand-selectors' },
  rules: {
    'require-selector': { create: bind(requireSelector) },
    'no-fresh-selector-result': { create: bind(noFreshSelectorResult) },
  },
}
