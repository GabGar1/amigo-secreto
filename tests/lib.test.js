import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TEXT_FIELDS,
  displayValue,
  fieldsChanged,
  isConfigured,
  normalizeFields,
  sortParticipants,
} from '../lib.js';

test('sortParticipants ordena em pt-BR e não muta a lista original', () => {
  const input = [
    { name: 'Zélia' },
    { name: 'ana' },
    { name: 'Álvaro' },
    { name: 'Bruno' },
  ];
  const sorted = sortParticipants(input);
  assert.deepEqual(sorted.map(({ name }) => name), ['Álvaro', 'ana', 'Bruno', 'Zélia']);
  assert.equal(input[0].name, 'Zélia');
});

test('displayValue mostra travessão para valores vazios', () => {
  assert.equal(displayValue(''), '—');
  assert.equal(displayValue('   '), '—');
  assert.equal(displayValue(null), '—');
  assert.equal(displayValue(undefined), '—');
  assert.equal(displayValue('  M  '), 'M');
});

test('normalizeFields faz trim em todos os campos exibidos', () => {
  assert.deepEqual(
    normalizeFields({
      pants_size: '  42 ',
      shirt_size: ' G ',
      shoe_size: ' 38 ',
      favorite_color: ' azul ',
      interests: ' livros ',
      gift_suggestion: ' ignorado ',
    }),
    {
      pants_size: '42',
      shirt_size: 'G',
      shoe_size: '38',
      favorite_color: 'azul',
      interests: 'livros',
    },
  );
});

test('normalizeFields trata campos ausentes', () => {
  const normalized = normalizeFields({});
  assert.equal(normalized.pants_size, '');
  assert.equal(normalized.interests, '');
  assert.equal('gift_suggestion' in normalized, false);
});

test('normalizeFields não inclui a sugestão de presente', () => {
  const normalized = normalizeFields({
    interests: ' livros ',
    gift_suggestion: 'um livro',
  });

  assert.deepEqual(Object.keys(normalized), TEXT_FIELDS);
  assert.equal('gift_suggestion' in normalized, false);
});

test('normalizeFields ignora campos que não são texto', () => {
  const normalized = normalizeFields({ interests: 42, pants_size: null });
  assert.equal(normalized.interests, '');
  assert.equal(normalized.pants_size, '');
});

test('TEXT_FIELDS contém os cinco campos editáveis', () => {
  assert.deepEqual(TEXT_FIELDS, [
    'pants_size',
    'shirt_size',
    'shoe_size',
    'favorite_color',
    'interests',
  ]);
});

test('fieldsChanged detecta mudanças após normalização', () => {
  const original = {
    pants_size: '42',
    shirt_size: 'G',
    shoe_size: '38',
    favorite_color: 'azul',
    interests: 'livros',
  };
  assert.equal(fieldsChanged(original, { ...original, pants_size: ' 42 ' }), false);
  assert.equal(fieldsChanged(original, { ...original, pants_size: '44' }), true);
});

test('isConfigured valida URL e chave anônima', () => {
  assert.equal(isConfigured('https://meuprojeto.supabase.co', 'a'.repeat(40)), true);
  assert.equal(isConfigured('https://meuprojeto.supabase.co', 'SUA-CHAVE-ANON-PUBLICA'), false);
  assert.equal(isConfigured('http://meuprojeto.supabase.co', 'a'.repeat(40)), false);
  assert.equal(isConfigured('', 'a'.repeat(40)), false);
});
