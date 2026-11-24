import { execFileSync } from 'node:child_process'

export function resolveDiffBase(root, requested) {
  for (const candidate of [requested, process.env.REACT_QUALITY_BASE, 'origin/main', 'main']) {
    if (!candidate) continue
    try {
      execFileSync('git', ['rev-parse', '--verify', `${candidate}^{commit}`], { cwd: root, stdio: 'ignore' })
      return candidate
    } catch {}
  }
  throw new Error('Pass a base SHA or make origin/main or main available locally.')
}
