import type { PropValue } from './types'

/** 求值节点 props：M1/M2 仅支持 literal；binding(M3)/expr(M7) 返回 undefined 占位 */
export function resolveProps(props: Record<string, PropValue> | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, pv] of Object.entries(props ?? {})) {
    out[key] = pv.kind === 'literal' ? pv.value : undefined
  }
  return out
}
