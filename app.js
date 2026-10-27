import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

import {
  displayValue,
  isConfigured,
  sortParticipants,
  TEXT_FIELDS,
} from './lib.js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config.js';

const FIELD_LABELS = {
  pants_size: 'Calça',
  shirt_size: 'Camiseta',
  shoe_size: 'Pé',
  favorite_color: 'Cor favorita',
  interests: 'Interesses',
  gift_suggestion: 'Sugestão de presente',
};

const select = document.querySelector('#person-select');
const status = document.querySelector('#status');
const table = document.querySelector('#participants-table');
const tbody = document.querySelector('#participants-body');
const emptyState = document.querySelector('#empty-state');

const supabase = isConfigured(SUPABASE_URL, SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

let participants = [];
let selectedId = null;

init();

function init() {
  if (!supabase) {
    select.innerHTML = '';
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Configuração pendente';
    select.append(option);
    select.disabled = true;
    setStatus(
      'Configure SUPABASE_URL e SUPABASE_ANON_KEY em config.js para carregar os participantes.',
      'error',
    );
    return;
  }

  select.addEventListener('change', handleSelectChange);
  loadParticipants();
}

async function loadParticipants() {
  select.disabled = true;
  setStatus('Carregando participantes…');

  const { data, error } = await supabase.from('participants').select('*');

  if (error) {
    select.innerHTML = '';
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Falha ao carregar';
    select.append(option);
    select.disabled = true;
    setStatus('Não foi possível carregar os participantes.', 'error', loadParticipants);
    return;
  }

  participants = sortParticipants(data ?? []);
  selectedId = null;
  setStatus('');
  render();
  populateSelect();
}

function render() {
  tbody.replaceChildren();
  table.hidden = participants.length === 0;
  emptyState.hidden = participants.length > 0;

  for (const participant of participants) {
    tbody.append(buildViewRow(participant));
  }
}

function buildViewRow(participant) {
  const row = document.createElement('tr');
  row.dataset.id = participant.id;
  if (participant.id === selectedId) row.classList.add('is-selected');

  const nameCell = document.createElement('th');
  nameCell.scope = 'row';
  nameCell.className = 'name-cell';
  nameCell.dataset.label = 'Nome';
  nameCell.textContent = participant.name;
  row.append(nameCell);

  for (const field of TEXT_FIELDS) {
    const cell = document.createElement('td');
    cell.dataset.label = FIELD_LABELS[field];
    cell.textContent = displayValue(participant[field]);
    if (displayValue(participant[field]) === '—') cell.classList.add('is-empty');
    row.append(cell);
  }

  const actionsCell = document.createElement('td');
  actionsCell.className = 'actions-cell';
  actionsCell.dataset.label = 'Ações';
  actionsCell.hidden = true;
  row.append(actionsCell);

  return row;
}

function populateSelect() {
  select.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent =
    participants.length === 0 ? 'Nenhum participante cadastrado' : 'Selecione seu nome';
  placeholder.disabled = true;
  select.append(placeholder);

  for (const participant of participants) {
    const option = document.createElement('option');
    option.value = participant.id;
    option.textContent = participant.name;
    select.append(option);
  }

  select.value = selectedId ?? '';
  select.disabled = participants.length === 0;
}

function handleSelectChange() {
  selectedId = select.value || null;
  render();
}

function setStatus(message, type = 'info', retry = null) {
  status.replaceChildren();
  status.className = 'status';

  if (!message) {
    status.hidden = true;
    return;
  }

  status.hidden = false;
  status.classList.add(type);

  const text = document.createElement('span');
  text.textContent = message;
  status.append(text);

  if (retry) {
    const retryButton = document.createElement('button');
    retryButton.type = 'button';
    retryButton.className = 'button button-link';
    retryButton.textContent = 'Tentar novamente';
    retryButton.addEventListener('click', retry);
    status.append(retryButton);
  }
}
