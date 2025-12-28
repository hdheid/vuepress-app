<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { useProjectStore } from '../stores/project';
import { useToastStore } from '../stores/toast';
import { invoke } from '@tauri-apps/api/core';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import FileTree from '../components/FileTree.vue';
import MarkdownIt from 'markdown-it';
import { Save, GitCommitHorizontal, UploadCloud, RefreshCw, FolderOpen, Loader2 } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const router = useRouter();
const projectStore = useProjectStore();
const toast = useToastStore();

const files = ref<any[]>([]);
const currentContent = ref('');
const currentPath = ref('');
const previewHtml = ref('');
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});
const isDirty = ref(false);
const commitMsg = ref('');
const showCommitDialog = ref(false);
const isCommitting = ref(false);
const isPushing = ref(false);

async function loadFiles() {
  if (!projectStore.projectPath) {
      router.push('/');
      return;
  }
  try {
    files.value = await invoke('get_project_files', { path: projectStore.projectPath });
  } catch (e) {
    console.error(e);
    toast.add('Error loading files: ' + e, 'error');
  }
}

async function onSelectFile(path: string) {
  if (isDirty.value) {
      if (!confirm('You have unsaved changes. Discard?')) return;
  }
  try {
    const content = await readTextFile(path);
    currentContent.value = content;
    currentPath.value = path;
    isDirty.value = false;
    renderPreview();
  } catch (e) {
    console.error(e);
    toast.add('Error reading file', 'error');
  }
}

function renderPreview() {
  previewHtml.value = md.render(currentContent.value);
}

watch(currentContent, () => {
  if (currentPath.value) isDirty.value = true;
  renderPreview();
});

async function saveFile() {
  if (!currentPath.value) return;
  try {
    await writeTextFile(currentPath.value, currentContent.value);
    isDirty.value = false;
    toast.add('File saved successfully', 'success');
  } catch (e) {
    console.error(e);
    toast.add('Error saving file: ' + e, 'error');
  }
}

async function commit() {
  if (!commitMsg.value) {
      toast.add('Please enter a commit message', 'warning');
      return;
  }
  isCommitting.value = true;
  try {
    await invoke('git_commit', { path: projectStore.projectPath, message: commitMsg.value });
    toast.add('Changes committed successfully', 'success');
    showCommitDialog.value = false;
    commitMsg.value = '';
  } catch (e) {
    toast.add('Error committing: ' + e, 'error');
  } finally {
    isCommitting.value = false;
  }
}

async function push() {
  isPushing.value = true;
  try {
    await invoke('git_push', { path: projectStore.projectPath });
    toast.add('Pushed to remote successfully!', 'success');
  } catch (e) {
    toast.add('Error pushing: ' + e, 'error');
  } finally {
    isPushing.value = false;
  }
}

// Keyboard shortcuts
function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (isDirty.value) {
      saveFile();
    }
  }
}

onMounted(() => {
  loadFiles();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div class="h-screen flex text-white overflow-hidden bg-transparent">
    <!-- Sidebar -->
    <div class="w-72 flex flex-col glass-panel border-r-0 my-4 ml-4 rounded-xl overflow-hidden">
      <div class="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md">
        <span class="font-bold text-xs tracking-wider text-gray-300">EXPLORER</span>
        <div class="flex space-x-1">
            <button @click="loadFiles" class="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors" title="Refresh">
                <RefreshCw :size="14"/>
            </button>
             <button @click="router.push('/')" class="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors" title="Open Project">
                <FolderOpen :size="14"/>
            </button>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto p-2 scrollbar-thin">
        <FileTree v-for="file in files" :key="file.path" :node="file" :activePath="currentPath" @select="onSelectFile" />
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col relative m-4 ml-2 glass-panel rounded-xl overflow-hidden">
       <!-- Toolbar -->
       <div class="h-14 border-b border-white/10 flex items-center px-6 bg-white/5 backdrop-blur-md justify-between">
          <div class="flex items-center space-x-2 overflow-hidden">
            <div class="w-2 h-2 rounded-full" :class="isDirty ? 'bg-yellow-500' : 'bg-green-500'"></div>
            <div class="text-sm text-gray-300 truncate max-w-md font-medium tracking-wide">{{ currentPath || 'No file selected' }}</div>
          </div>
          
          <div class="flex items-center space-x-3">
             <button @click="saveFile" :disabled="!isDirty" class="glass-button flex items-center space-x-2" :class="{'opacity-50 cursor-not-allowed': !isDirty}" title="Save (Ctrl+S)">
                <Save :size="16" />
                <span class="text-xs font-medium">Save</span>
             </button>
             
             <div class="relative">
                 <button @click="showCommitDialog = !showCommitDialog" class="glass-button flex items-center space-x-2" title="Commit">
                    <GitCommitHorizontal :size="16" />
                    <span class="text-xs font-medium">Commit</span>
                 </button>
                 
                 <!-- Commit Dialog Popover -->
                 <div v-if="showCommitDialog" class="absolute top-12 right-0 z-50 w-80 glass-card p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="text-xs font-bold text-gray-300 uppercase tracking-wide">Commit Changes</h3>
                        <button @click="showCommitDialog = false" class="text-gray-500 hover:text-white transition-colors">✕</button>
                    </div>
                    <textarea 
                        v-model="commitMsg" 
                        placeholder="Commit message..." 
                        class="glass-input w-full h-24 resize-none text-sm mb-3"
                        autofocus
                    ></textarea>
                    <div class="flex justify-end space-x-2">
                        <button @click="commit" :disabled="isCommitting" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white transition-all shadow-lg shadow-blue-500/20 flex items-center">
                            <Loader2 v-if="isCommitting" class="animate-spin mr-2" :size="12" />
                            COMMIT
                        </button>
                    </div>
                 </div>
             </div>

             <button @click="push" :disabled="isPushing" class="glass-button flex items-center space-x-2" title="Push to Remote">
                <Loader2 v-if="isPushing" class="animate-spin" :size="16" />
                <UploadCloud v-else :size="16" />
                <span class="text-xs font-medium">Push</span>
             </button>
          </div>
       </div>

       <!-- Editor & Preview Split -->
       <div class="flex-1 flex overflow-hidden">
          <!-- Editor -->
          <div class="w-1/2 flex flex-col border-r border-white/10 bg-black/20">
             <textarea 
               v-model="currentContent" 
               class="flex-1 w-full bg-transparent text-gray-200 p-6 outline-none resize-none font-mono text-sm leading-relaxed selection:bg-blue-500/30 placeholder-gray-600"
               placeholder="Select a file to start editing..."
               spellcheck="false"
             ></textarea>
          </div>
          
          <!-- Preview -->
          <div class="w-1/2 flex flex-col bg-black/10 relative">
             <div class="absolute top-0 right-0 p-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest select-none pointer-events-none">Preview</div>
             <div class="flex-1 p-8 overflow-y-auto prose prose-invert prose-sm max-w-none prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10" v-html="previewHtml">
             </div>
          </div>
       </div>
    </div>
  </div>
</template>

<style scoped>
.glass-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
}
</style>
