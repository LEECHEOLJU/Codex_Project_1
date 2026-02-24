import { db } from '@/lib/store';

function pickPath(obj, path) {
  if (!path) return undefined;
  const clean = path.replace(/^payload\./, '');
  return clean.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function transform(value, fnName) {
  switch (fnName) {
    case 'to_lower': return typeof value === 'string' ? value.toLowerCase() : value;
    case 'to_upper': return typeof value === 'string' ? value.toUpperCase() : value;
    case 'to_int': return Number.parseInt(value, 10);
    case 'map_enum':
      if (typeof value === 'string') {
        const v = value.toLowerCase();
        if (['critical', 'high', 'medium', 'low'].includes(v)) return v;
      }
      return value;
    default:
      return value;
  }
}

function setPath(target, path, value) {
  if (!path) return;
  const clean = path.replace(/^ticket\./, '');
  const parts = clean.split('.');
  let cur = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (!cur[parts[i]]) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

export function getActiveMapping(connectorId) {
  const candidates = db().mappings.filter((m) => m.connectorId === connectorId && m.status === 'published');
  return candidates[candidates.length - 1] || null;
}

export function applyMapping({ connectorId, payload, base }) {
  const mapping = getActiveMapping(connectorId);
  if (!mapping) return { ...base, customFields: {} };

  const out = { ...base, customFields: {} };
  for (const rule of mapping.rules || []) {
    const raw = pickPath(payload, rule.source);
    const val = transform(raw, rule.transform);
    setPath(out, rule.target, val);
  }
  return out;
}
