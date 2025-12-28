<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useProjectStore } from '../stores/project';
import { invoke } from '@tauri-apps/api/core';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import FileTree from '../components/FileTree.vue';
import MarkdownIt from 'markdown-it';
import { Save, GitCommitHorizontal, UploadCloud, RefreshCw, FolderOpen } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const router = useRouter();
const projectStore = useProjectStore();
const files = ref<any[]>([]);
const currentContent = ref('');
const currentPath = ref('');
const previewHtml = ref('');
const md = new MarkdownIt();
const isDirty = ref(false);
const commitMsg = ref('');
const showCommitDialog = ref(false);
const statusMsg = ref('');

async function loadFiles() {
  if (!projectStore.projectPath) {
      router.push('/');
      return;
  }
  try {
    files.value = await invoke('get_project_files', { path: projectStore.projectPath });
  } catch (e) {
    console.error(e);
    statusMsg.value = 'Error loading files: ' + e;
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
    statusMsg.value = 'Saved!';
    setTimeout(() => statusMsg.value = '', 2000);
  } catch (e) {
    console.error(e);
    statusMsg.value = 'Error saving: ' + e;
  }
}

async function commit() {
  if (!commitMsg.value) {
      alert('Please enter a commit message');
      return;
  }
  try {
    statusMsg.value = 'Committing...';
    await invoke('git_commit', { path: projectStore.projectPath, message: commitMsg.value });
    statusMsg.value = 'Committed!';
    showCommitDialog.value = false;
    commitMsg.value = '';
    setTimeout(() => statusMsg.value = '', 2000);
  } catch (e) {
    statusMsg.value = 'Error committing: ' + e;
  }
}

async function push() {
  try {
    statusMsg.value = 'Pushing...';
    await invoke('git_push', { path: projectStore.projectPath });
    statusMsg.value = 'Pushed successfully!';
    setTimeout(() => statusMsg.value = '', 2000);
  } catch (e) {
    statusMsg.value = 'Error pushing: ' + e;
  }
}

onMounted(() => {
  loadFiles();
});
</script>

<template>
  <div class="h-screen flex text-white bg-gray-900 overflow-hidden">
    <!-- Sidebar -->
    <div class="w-64 border-r border-white/10 flex flex-col bg-gray-800/50 backdrop-blur-md">
      <div class="p-4 border-b border-white/10 flex justify-between items-center bg-gray-900/20">
        <span class="font-bold text-xs tracking-wider text-gray-400">EXPLORER</span>
        <div class="flex space-x-2">
            <button @click="loadFiles" class="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="Refresh">
                <RefreshCw :size="14"/>
            </button>
             <button @click="router.push('/')" class="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="Open Project">
                <FolderOpen :size="14"/>
            </button>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto p-2 scrollbar-thin">
        <FileTree v-for="file in files" :key="file.path" :node="file" @select="onSelectFile" />
      </div>
    </div>

    <!-- Main -->
    <div class="flex-1 flex flex-col relative">
       <!-- Toolbar -->
       <div class="h-12 border-b border-white/10 flex items-center px-4 bg-gray-800/30 justify-between backdrop-blur-sm">
          <div class="text-sm text-gray-400 truncate max-w-md font-mono">{{ currentPath }}</div>
          <div class="flex items-center space-x-3">
             <span v-if="statusMsg" class="text-xs text-green-400 mr-4 animate-pulse">{{ statusMsg }}</span>
             
             <button @click="saveFile" :disabled="!isDirty" class="btn" :class="{'opacity-50 cursor-not-allowed': !isDirty}" title="Save">
                <Save :size="18" />
             </button>
             
             <div class="relative">
                 <button @click="showCommitDialog = !showCommitDialog" class="btn" title="Commit">
                    <GitCommitHorizontal :size="18" />
                 </button>
                 <!-- Commit Dialog Popover -->
                 <div v-if="showCommitDialog" class="absolute top-10 right-0 z-50 w-80 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-2xl p-4">
                    <h3 class="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Commit Changes</h3>
                    <textarea 
                        v-model="commitMsg" 
                        placeholder="Commit message..." 
                        class="w-full bg-black/20 text-white text-sm p-3 rounded border border-white/10 focus:border-blue-500 outline-none mb-3 h-24 resize-none placeholder-gray-600"
                    ></textarea>
                    <div class="flex justify-end space-x-2">
                        <button @click="showCommitDialog = false" class="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">Cancel</button>
                        <button @click="commit" class="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold text-white transition-colors">COMMIT</button>
                    </div>
                 </div>
             </div>

             <button @click="push" class="btn" title="Push to Remote">
                <UploadCloud :size="18" />
             </button>
          </div>
       </div>

       <!-- Editor & Preview -->
       <div class="flex-1 flex overflow-hidden">
          <div class="w-1/2 border-r border-white/10 flex flex-col">
             <textarea 
               v-model="currentContent" 
               class="flex-1 w-full bg-[#1e1e1e] text-gray-300 p-6 outline-none resize-none font-mono text-sm leading-relaxed"
               placeholder="Select a file to edit..."
               spellcheck="false"
             ></textarea>
          </div>
          <div class="w-1/2 flex flex-col bg-[#1e1e1e] relative">
             <div class="absolute top-0 right-0 p-2 text-xs text-gray-600 font-bold uppercase tracking-wider select-none pointer-events-none">Preview</div>
             <div class="flex-1 p-8 overflow-y-auto prose prose-invert prose-sm max-w-none" v-html="previewHtml">
             </div>
          </div>
       </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent; 
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #374151; 
  border-radius: 3px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #4b5563; 
}
</style>
