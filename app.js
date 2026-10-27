import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

import {
  displayValue,
  fieldsChanged,
  isConfigured,
  normalizeFields,
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
const actionsHeader = document.querySelector('#actions-header');

const supabase = isConfigured(SUPABASE_URL, SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

let participants = [];
let selectedId = null;
let editing = false;

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
  editing = false;
  setStatus('');
  render();
  populateSelect();
}

function render() {
  tbody.replaceChildren();
  table.hidden = participants.length === 0;
  emptyState.hidden = participants.length > 0;
  actionsHeader.hidden = !editing;

  for (const participant of participants) {
    const row =
      participant.id === selectedId && editing
        ? buildEditRow(participant)
        : buildViewRow(participant);
    tbody.append(row);
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

function buildEditRow(participant) {
  const row = document.createElement('tr');
  row.dataset.id = participant.id;
  row.classList.add('is-editing');

  const nameCell = document.createElement('th');
  nameCell.scope = 'row';
  nameCell.className = 'name-cell';
  nameCell.dataset.label = 'Nome';
  nameCell.textContent = participant.name;
  row.append(nameCell);

  for (const field of TEXT_FIELDS) {
    const cell = document.createElement('td');
    cell.dataset.label = FIELD_LABELS[field];

    const input = document.createElement('input');
    input.type = 'text';
    input.name = field;
    input.value = participant[field] ?? '';
    input.setAttribute('aria-label', FIELD_LABELS[field]);
    input.autocomplete = 'off';

    if (field === 'gift_suggestion') {
      input.maxLength = 200;
      input.placeholder = 'Uma frase curta';
    }

    cell.append(input);
    row.append(cell);
  }

  const actionsCell = document.createElement('td');
  actionsCell.className = 'actions-cell';
  actionsCell.dataset.label = 'Ações';

  const saveButton = document.createElement('button');
  saveButton.type = 'button';
  saveButton.className = 'button button-primary';
  saveButton.dataset.action = 'save';
  saveButton.textContent = 'Salvar';
  saveButton.addEventListener('click', () => saveParticipant(participant));

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = 'button button-secondary';
  cancelButton.dataset.action = 'cancel';
  cancelButton.textContent = 'Cancelar';
  cancelButton.addEventListener('click', cancelEditing);

  actionsCell.append(saveButton, cancelButton);
  row.append(actionsCell);

  return row;
}

function startEditing(id) {
  selectedId = id;
  editing = true;
  setStatus('');
  render();
  tbody.querySelector('input')?.focus();
}

function readDraft() {
  const draft = {};

  for (const field of TEXT_FIELDS) {
    const input = tbody.querySelector(`input[name="${field}"]`);
    draft[field] = input?.value ?? '';
  }

  return draft;
}

function handleSelectChange() {
  const nextId = select.value || null;

  if (!nextId) return;

  if (editing && nextId !== selectedId) {
    const currentDraft = readDraft();
    const original = participants.find(({ id }) => id === selectedId);

    if (original && fieldsChanged(original, currentDraft)) {
      const shouldDiscard = window.confirm('Descartar as alterações não salvas?');
      if (!shouldDiscard) {
        select.value = selectedId;
        return;
      }
    }
  }

  if (nextId === selectedId && editing) return;

  startEditing(nextId);
}

async function saveParticipant(participant) {
  const fields = normalizeFields(readDraft());
  setStatus('');
  setSaving(true);

  const { data, error } = await supabase
    .from('participants')
    .update(fields)
    .eq('id', participant.id)
    .select()
    .single();

  if (error) {
    setSaving(false);
    setStatus('Não foi possível salvar as informações. Tente novamente.', 'error');
    return;
  }

  participants = sortParticipants(
    participants.map((item) => (item.id === data.id ? data : item)),
  );
  selectedId = null;
  editing = false;
  render();
  populateSelect();
  select.focus();
  setStatus('Informações salvas com sucesso.', 'success');
}

function cancelEditing() {
  selectedId = null;
  editing = false;
  render();
  populateSelect();
  select.focus();
  setStatus('');
}

function setSaving(isSaving) {
  select.disabled = isSaving || participants.length === 0;

  const saveButton = tbody.querySelector('[data-action="save"]');
  const cancelButton = tbody.querySelector('[data-action="cancel"]');

  if (saveButton) {
    saveButton.disabled = isSaving;
    saveButton.textContent = isSaving ? 'Salvando…' : 'Salvar';
  }

  if (cancelButton) {
    cancelButton.disabled = isSaving;
  }
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
