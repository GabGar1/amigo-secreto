export const TEXT_FIELDS = [
  'pants_size',
  'shirt_size',
  'shoe_size',
  'favorite_color',
  'interests',
];

export function sortParticipants(participants) {
  return [...participants].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
  );
}

export function displayValue(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text === '' ? '—' : text;
}

export function normalizeFields(input) {
  const source = input ?? {};
  const result = {};

  for (const field of TEXT_FIELDS) {
    const value = typeof source[field] === 'string' ? source[field].trim() : '';
    result[field] = value;
  }

  return result;
}

export function fieldsChanged(original, current) {
  const normalizedOriginal = normalizeFields(original);
  const normalizedCurrent = normalizeFields(current);

  return TEXT_FIELDS.some(
    (field) => normalizedOriginal[field] !== normalizedCurrent[field],
  );
}

export function isConfigured(url, key) {
  if (typeof url !== 'string' || typeof key !== 'string') return false;

  const trimmedUrl = url.trim();
  const trimmedKey = key.trim();

  return (
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(trimmedUrl) &&
    !trimmedUrl.includes('SEU-PROJETO') &&
    trimmedKey.length >= 20 &&
    !trimmedKey.includes('SUA-CHAVE')
  );
}
