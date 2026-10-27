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

test('normalizeFields faz trim em todos os campos', () => {
  assert.deepEqual(
    normalizeFields({
      pants_size: '  42 ',
      shirt_size: ' G ',
      shoe_size: ' 38 ',
      favorite_color: ' azul ',
      interests: ' livros ',
      gift_suggestion: ' um livro ',
    }),
    {
      pants_size: '42',
      shirt_size: 'G',
      shoe_size: '38',
      favorite_color: 'azul',
      interests: 'livros',
      gift_suggestion: 'um livro',
    },
  );
});

test('normalizeFields trata campos ausentes', () => {
  const normalized = normalizeFields({});
  assert.equal(normalized.pants_size, '');
  assert.equal(normalized.gift_suggestion, '');
});

test('normalizeFields transforma a sugestão em linha única', () => {
  const normalized = normalizeFields({ gift_suggestion: '  um\npresente   legal  ' });
  assert.equal(normalized.gift_suggestion, 'um presente legal');
});

test('normalizeFields limita a sugestão a 200 caracteres', () => {
  assert.equal(normalizeFields({ gift_suggestion: 'a'.repeat(250) }).gift_suggestion.length, 200);
});

test('normalizeFields ignora campos que não são texto', () => {
  const normalized = normalizeFields({ interests: 42, gift_suggestion: null });
  assert.equal(normalized.interests, '');
  assert.equal(normalized.gift_suggestion, '');
});

test('TEXT_FIELDS contém os seis campos editáveis', () => {
  assert.deepEqual(TEXT_FIELDS, [
    'pants_size',
    'shirt_size',
    'shoe_size',
    'favorite_color',
    'interests',
    'gift_suggestion',
  ]);
});

test('fieldsChanged detecta mudanças após normalização', () => {
  const original = {
    pants_size: '42',
    shirt_size: 'G',
    shoe_size: '38',
    favorite_color: 'azul',
    interests: 'livros',
    gift_suggestion: 'um livro',
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
