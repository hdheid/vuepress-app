<script setup lang="ts">
import { ref } from 'vue';
import { Folder, File, ChevronRight, ChevronDown, FileCode, FileJson, FileImage, FileText } from 'lucide-vue-next';

interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
}

const props = defineProps<{
  node: FileNode;
  depth?: number;
  activePath?: string;
}>();

const emit = defineEmits<{
  (e: 'select', path: string): void;
}>();

const isOpen = ref(false);

function toggle() {
  if (props.node.is_dir) {
    isOpen.value = !isOpen.value;
  } else {
    emit('select', props.node.path);
  }
}

function onSelect(path: string) {
  emit('select', path);
}

// Helper to determine icon based on extension
function getFileIcon(name: string) {
  if (name.endsWith('.md')) return FileText;
  if (name.endsWith('.json')) return FileJson;
  if (name.endsWith('.vue') || name.endsWith('.ts') || name.endsWith('.js')) return FileCode;
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.svg')) return FileImage;
  return File;
}

const FileIcon = getFileIcon(props.node.name);
</script>

<template>
  <div class="text-sm select-none font-medium tracking-wide">
    <div 
      class="flex items-center py-1.5 px-2 cursor-pointer transition-all duration-200 rounded-md mx-1 mb-0.5 group"
      :class="[
        activePath === node.path 
          ? 'bg-blue-600/20 text-blue-200 shadow-sm border border-blue-500/10' 
          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
      ]"
      :style="{ paddingLeft: `${(depth || 0) * 12 + 8}px` }"
      @click="toggle"
    >
      <span v-if="node.is_dir" class="mr-1.5 text-gray-500 group-hover:text-gray-300 transition-colors">
        <ChevronDown v-if="isOpen" :size="14" />
        <ChevronRight v-else :size="14" />
      </span>
      <span v-else class="mr-1.5 w-3.5"></span>
      
      <Folder v-if="node.is_dir" :size="16" class="mr-2 text-blue-400/80 group-hover:text-blue-400 transition-colors" />
      <component :is="FileIcon" v-else :size="16" class="mr-2 opacity-70 group-hover:opacity-100 transition-opacity" :class="activePath === node.path ? 'text-blue-300' : 'text-gray-400'" />
      
      <span class="truncate" :class="{'font-semibold': node.is_dir}">
        {{ node.name }}
      </span>
    </div>
    
    <div v-if="isOpen && node.children" class="border-l border-white/5 ml-[15px]">
      <FileTree 
        v-for="child in node.children" 
        :key="child.path" 
        :node="child" 
        :depth="(depth || 0) + 1"
        :activePath="activePath"
        @select="onSelect"
      />
    </div>
  </div>
</template>
