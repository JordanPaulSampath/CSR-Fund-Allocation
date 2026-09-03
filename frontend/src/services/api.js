// Stateless API plumbing shared by the Pillar 5 / Pillar 6 components.
// Kept out of context/ on purpose — this is transport, not app state.

// Same-origin by default (dev proxy + prod bundle both route to FastAPI).
const BASE = import.meta.env.VITE_API_URL ?? ''

function authHeaders() {
  try {
    const token = localStorage.getItem('csr_helper_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { ...(auth ? authHeaders() : {}) }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const j = await res.json()
      detail = j.detail || detail
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }
  if (res.status === 204) return null
  return res.json()
}

// Pillar 5 — implementing partners
export const listPartners = ({ sector, region } = {}) => {
  const q = new URLSearchParams()
  if (sector) q.set('sector', sector)
  if (region) q.set('region', region)
  const qs = q.toString()
  return request(`/partners${qs ? `?${qs}` : ''}`)
}

export const matchPartners = (proposalId, topN = 3) =>
  request(`/proposals/${proposalId}/match?top_n=${topN}`, { method: 'POST' })

// Pillar 6 — remaining-budget advisor
export const remainingBudgetAdvice = () => request('/allocate/remaining')

// shared
export const listProposals = () => request('/proposals')

export default { listPartners, matchPartners, remainingBudgetAdvice, listProposals }
