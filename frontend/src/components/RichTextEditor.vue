<template>
  <div class="rounded-lg border border-slate-200 bg-white">
    <div class="editor-toolbar">
      <button class="toolbar-btn" :class="{ active: mode === 'html' }" type="button" @click.prevent="toggleMode" title="Alternar HTML">
        <font-awesome-icon :icon="icons.code" />
        <span>HTML</span>
      </button>
      <span class="divider"></span>
      <button class="toolbar-btn" :class="{ active: active.bold }" type="button" @click.prevent="exec('bold')" title="Negrito (Ctrl/Cmd+B)">
        <font-awesome-icon :icon="icons.bold" />
        <span>Negrito</span>
      </button>
      <button class="toolbar-btn" :class="{ active: active.italic }" type="button" @click.prevent="exec('italic')" title="Itálico (Ctrl/Cmd+I)">
        <font-awesome-icon :icon="icons.italic" />
        <span>Itálico</span>
      </button>
      <button class="toolbar-btn" :class="{ active: active.underline }" type="button" @click.prevent="exec('underline')" title="Sublinhado (Ctrl/Cmd+U)">
        <font-awesome-icon :icon="icons.underline" />
        <span>Sublinhado</span>
      </button>
      <button class="toolbar-btn" :class="{ active: active.strike }" type="button" @click.prevent="exec('strikeThrough')" title="Riscado">
        <font-awesome-icon :icon="icons.strike" />
        <span>Riscado</span>
      </button>
      <span class="divider"></span>
      <button class="toolbar-btn" :class="{ active: active.block === 'h2' }" type="button" @click.prevent="formatBlock('h2')" title="Título H2">
        <font-awesome-icon :icon="icons.heading" />
        <span>H2</span>
      </button>
      <button class="toolbar-btn" :class="{ active: active.block === 'h3' }" type="button" @click.prevent="formatBlock('h3')" title="Título H3">
        <font-awesome-icon :icon="icons.heading" />
        <span>H3</span>
      </button>
      <button class="toolbar-btn" :class="{ active: active.block === 'p' }" type="button" @click.prevent="formatBlock('p')" title="Parágrafo">
        <font-awesome-icon :icon="icons.paragraph" />
        <span>Parágrafo</span>
      </button>
      <span class="divider"></span>
      <button class="toolbar-btn" :class="{ active: active.ul }" type="button" @click.prevent="exec('insertUnorderedList')" title="Lista">
        <font-awesome-icon :icon="icons.listUl" />
        <span>Lista</span>
      </button>
      <button class="toolbar-btn" :class="{ active: active.ol }" type="button" @click.prevent="exec('insertOrderedList')" title="Lista numerada">
        <font-awesome-icon :icon="icons.listOl" />
        <span>Numerada</span>
      </button>
      <button class="toolbar-btn" :class="{ active: active.block === 'blockquote' }" type="button" @click.prevent="exec('blockquote')" title="Citação">
        <font-awesome-icon :icon="icons.quote" />
        <span>Citação</span>
      </button>
      <span class="divider"></span>
      <button class="toolbar-btn" :class="{ active: active.link }" type="button" @click.prevent="createLink" title="Inserir link (Ctrl/Cmd+K)">
        <font-awesome-icon :icon="icons.link" />
        <span>Link</span>
      </button>
      <button class="toolbar-btn" type="button" @click.prevent="exec('removeFormat')" title="Limpar formatação">
        <font-awesome-icon :icon="icons.eraser" />
        <span>Limpar</span>
      </button>
      <span class="divider"></span>
      <button class="toolbar-btn" type="button" @click.prevent="exec('undo')" title="Desfazer">
        <font-awesome-icon :icon="icons.undo" />
        <span>Desfazer</span>
      </button>
      <button class="toolbar-btn" type="button" @click.prevent="exec('redo')" title="Refazer">
        <font-awesome-icon :icon="icons.redo" />
        <span>Refazer</span>
      </button>
    </div>
    <textarea
      v-if="mode === 'html'"
      v-model="htmlBuffer"
      class="editor-source"
      spellcheck="false"
      @input="onHtmlInput"
      @focus="isFocused = true"
      @blur="handleBlur"
    ></textarea>
    <div
      v-else
      ref="editorRef"
      class="editor-surface"
      :data-placeholder="placeholder"
      contenteditable="true"
      @input="onInput"
      @keydown="handleKeydown"
      @keyup="handleKeyup"
      @mouseup="updateActive"
      @focus="isFocused = true"
      @blur="handleBlur"
      @paste="handlePaste"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faBold,
  faCode,
  faItalic,
  faUnderline,
  faStrikethrough,
  faHeading,
  faParagraph,
  faListUl,
  faListOl,
  faQuoteRight,
  faLink,
  faEraser,
  faRotateLeft,
  faRotateRight
} from '@fortawesome/free-solid-svg-icons';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    enableShortcuts?: boolean;
  }>(),
  { placeholder: 'Escreva o conteúdo do email...', enableShortcuts: true }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const icons = {
  bold: faBold,
  code: faCode,
  italic: faItalic,
  underline: faUnderline,
  strike: faStrikethrough,
  heading: faHeading,
  paragraph: faParagraph,
  listUl: faListUl,
  listOl: faListOl,
  quote: faQuoteRight,
  link: faLink,
  eraser: faEraser,
  undo: faRotateLeft,
  redo: faRotateRight
};

const editorRef = ref<HTMLDivElement | null>(null);
const isFocused = ref(false);
const mode = ref<'visual' | 'html'>('visual');
const htmlBuffer = ref('');
const active = ref({
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  ul: false,
  ol: false,
  link: false,
  block: 'p' as 'p' | 'h2' | 'h3' | 'blockquote'
});

function exec(command: string) {
  document.execCommand(command);
  onInput();
  updateActive();
}

function formatBlock(tag: 'p' | 'h2' | 'h3') {
  document.execCommand('formatBlock', false, tag);
  onInput();
  updateActive();
}

function createLink() {
  const url = window.prompt('Cole o link');
  if (!url) return;
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  document.execCommand('createLink', false, normalized);
  onInput();
  updateActive();
}

function onInput() {
  if (mode.value === 'html') {
    emit('update:modelValue', htmlBuffer.value);
    return;
  }
  const html = editorRef.value?.innerHTML ?? '';
  emit('update:modelValue', html);
  htmlBuffer.value = html;
}

function handlePaste(event: ClipboardEvent) {
  if (mode.value === 'html') return;
  event.preventDefault();
  const text = event.clipboardData?.getData('text/plain') ?? '';
  if (!text) return;
  const looksLikeDocument = /<!doctype\s+html/i.test(text) || /<html[\s>]/i.test(text);
  if (looksLikeDocument) {
    mode.value = 'html';
    htmlBuffer.value = text;
    emit('update:modelValue', text);
    return;
  }
  document.execCommand('insertText', false, text);
  onInput();
  updateActive();
}

function handleKeyup() {
  onInput();
  updateActive();
}

function handleKeydown(event: KeyboardEvent) {
  if (mode.value === 'html') return;
  if (!props.enableShortcuts) return;
  if (!(event.ctrlKey || event.metaKey)) return;

  const key = event.key.toLowerCase();
  if (key === 'b') {
    event.preventDefault();
    exec('bold');
  } else if (key === 'i') {
    event.preventDefault();
    exec('italic');
  } else if (key === 'u') {
    event.preventDefault();
    exec('underline');
  } else if (key === 'k') {
    event.preventDefault();
    createLink();
  }
}

function updateActive() {
  if (mode.value === 'html') return;
  active.value.bold = document.queryCommandState('bold');
  active.value.italic = document.queryCommandState('italic');
  active.value.underline = document.queryCommandState('underline');
  active.value.strike = document.queryCommandState('strikeThrough');
  active.value.ul = document.queryCommandState('insertUnorderedList');
  active.value.ol = document.queryCommandState('insertOrderedList');
  active.value.link = document.queryCommandState('createLink');
  const block = document.queryCommandValue('formatBlock')?.toString().toLowerCase();
  if (block === 'h2' || block === 'h3' || block === 'blockquote' || block === 'p') {
    active.value.block = block;
  }
}

function handleBlur() {
  isFocused.value = false;
  if (mode.value === 'html') {
    onHtmlInput();
  } else {
    onInput();
  }
}

function onHtmlInput() {
  emit('update:modelValue', htmlBuffer.value);
}

function toggleMode() {
  if (mode.value === 'visual') {
    mode.value = 'html';
    htmlBuffer.value = editorRef.value?.innerHTML ?? props.modelValue ?? '';
  } else {
    mode.value = 'visual';
    if (editorRef.value) {
      editorRef.value.innerHTML = htmlBuffer.value || '';
    }
    emit('update:modelValue', htmlBuffer.value);
    updateActive();
  }
}

// Preview removido por solicitação do usuário.

onMounted(() => {
  if (editorRef.value) {
    editorRef.value.innerHTML = props.modelValue || '';
  }
  htmlBuffer.value = props.modelValue || '';
  updateActive();
});

watch(
  () => props.modelValue,
  (value) => {
    if (!editorRef.value) return;
    if (isFocused.value) return;
    if (editorRef.value.innerHTML !== value) {
      editorRef.value.innerHTML = value || '';
    }
    if (mode.value === 'html' && htmlBuffer.value !== value) {
      htmlBuffer.value = value || '';
    }
    updateActive();
  }
);
</script>

<style scoped>
[contenteditable='true']:empty:before {
  content: attr(data-placeholder);
  color: rgb(148 163 184);
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid rgb(226 232 240);
  padding: 0.5rem 0.75rem;
  background: linear-gradient(180deg, rgb(248 250 252), rgb(241 245 249));
  font-size: 0.875rem;
}

.editor-surface {
  min-height: 220px;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: rgb(15 23 42);
  outline: none;
}

.editor-source {
  min-height: 220px;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: rgb(15 23 42);
  outline: none;
  background: rgb(248 250 252);
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: 9999px;
  border: 1px solid rgb(226 232 240);
  padding: 0.3rem 0.85rem;
  color: rgb(30 41 59);
  background: rgb(255 255 255);
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
  transition: background 0.2s ease, border 0.2s ease;
}

.toolbar-btn:hover {
  background: rgb(226 232 240);
  border-color: rgb(203 213 225);
}

.toolbar-btn.active {
  background: rgb(15 23 42);
  color: white;
  border-color: rgb(15 23 42);
}

.divider {
  width: 1px;
  height: 1rem;
  background: rgb(203 213 225);
}

[contenteditable='true']:empty:before {
  content: attr(data-placeholder);
  color: rgb(148 163 184);
}
</style>
