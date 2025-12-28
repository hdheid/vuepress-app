<script setup lang="ts">
import { ref } from 'vue';
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-vue-next';

interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
}

const props = defineProps<{
  node: FileNode;
  depth?: number;
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
</script>

<template>
  <div class="text-sm select-none">
    <div 
      class="flex items-center py-1 px-2 hover:bg-white/5 cursor-pointer transition-colors rounded-sm"
      :style="{ paddingLeft: `${(depth || 0) * 12 + 8}px` }"
      @click="toggle"
    >
      <span v-if="node.is_dir" class="mr-1 text-gray-400">
        <ChevronDown v-if="isOpen" :size="14" />
        <ChevronRight v-else :size="14" />
      </span>
      <span v-else class="mr-1 w-4"></span>
      
      <Folder v-if="node.is_dir" :size="14" class="mr-2 text-blue-400" />
      <File v-else :size="14" class="mr-2 text-gray-400" />
      
      <span :class="{'text-gray-300': !node.is_dir, 'text-gray-100 font-medium': node.is_dir}" class="truncate">
        {{ node.name }}
      </span>
    </div>
    
    <div v-if="isOpen && node.children">
      <FileTree 
        v-for="child in node.children" 
        :key="child.path" 
        :node="child" 
        :depth="(depth || 0) + 1"
        @select="onSelect"
      />
    </div>
  </div>
</template>
