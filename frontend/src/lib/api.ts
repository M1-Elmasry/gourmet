const BASE = '/api'

function getToken() {
  return localStorage.getItem('token')
}

function getAdminToken() {
  return localStorage.getItem('adminToken')
}

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

async function authRequest(path: string, options: RequestInit = {}) {
  const token = getToken()
  return request(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
}

async function adminRequest(path: string, options: RequestInit = {}) {
  const token = getAdminToken()
  return request(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
}

export const api = {
  register: (name: string, password: string) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, password }),
    }),

  login: (name: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ name, password }),
    }),

  adminLogin: (username: string, password: string) =>
    request('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  checkin: (imageBlob: Blob) => {
    const token = getToken()
    const form = new FormData()
    form.append('image', imageBlob, 'capture.jpg')
    return fetch(`${BASE}/checkin`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }).then(async (r) => {
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      return d
    })
  },

  checkout: (imageBlob: Blob) => {
    const token = getToken()
    const form = new FormData()
    form.append('image', imageBlob, 'capture.jpg')
    return fetch(`${BASE}/checkout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }).then(async (r) => {
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      return d
    })
  },

  getRecords: () => adminRequest('/admin/records'),

  downloadSheet: async () => {
    const token = getAdminToken()
    const res = await fetch(`${BASE}/admin/download`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Download failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `checkin-${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  },
}
