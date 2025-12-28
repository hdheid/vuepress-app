<script setup lang="ts">
import { ref } from 'vue';
import { open } from '@tauri-apps/plugin-dialog';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../stores/project';
import { useToastStore } from '../stores/toast';
import { exists, readTextFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import { FolderOpen, ArrowRight } from 'lucide-vue-next';

const router = useRouter();
const projectStore = useProjectStore();
const toast = useToastStore();
const isLoading = ref(false);

async function openProject() {
  isLoading.value = true;
  try {
    const selected = await open({
      directory: true,
      multiple: false,
    });

    if (selected) {
      const path = selected as string;
      
      // Check .git
      const gitPath = await join(path, '.git');
      const hasGit = await exists(gitPath); 
      
      if (!hasGit) {
        toast.add('Not a git repository.', 'error');
        isLoading.value = false;
        return;
      }
      
      // Check package.json for vuepress-theme-plume
      const packageJsonPath = await join(path, 'package.json');
      if (await exists(packageJsonPath)) {
        const content = await readTextFile(packageJsonPath);
        const json = JSON.parse(content);
        const deps = { ...json.dependencies, ...json.devDependencies };
        
        // Loose check for plume theme
        if (deps['vuepress-theme-plume']) {
             projectStore.setProject(path);
             projectStore.isGitRepo = true;
             projectStore.isVuePressThemePlume = true;
             toast.add('Project opened successfully', 'success');
             router.push('/editor');
        } else {
             toast.add('vuepress-theme-plume not found in package.json', 'error');
        }
      } else {
          toast.add('package.json not found.', 'error');
      }
    }
  } catch (err) {
    console.error(err);
    toast.add('Error opening directory: ' + err, 'error');
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
    <!-- Decorative background elements -->
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] -z-10 animate-pulse" style="animation-delay: 1s;"></div>

    <div class="glass-card p-12 flex flex-col items-center max-w-lg w-full text-center relative z-10 border-t border-white/20">
      <div class="w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-8 transform hover:scale-105 transition-transform duration-300">
        <FolderOpen class="text-white w-10 h-10" />
      </div>
      
      <h1 class="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
        Plume Editor
      </h1>
      <p class="text-gray-400 mb-10 text-lg font-light leading-relaxed">
        A modern, glassmorphism-styled editor for your VuePress Plume projects.
      </p>

      <button 
        @click="openProject" 
        :disabled="isLoading"
        class="group relative px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-xl shadow-white/5 hover:shadow-white/10 w-full flex items-center justify-center space-x-2 overflow-hidden"
      >
        <span v-if="isLoading" class="animate-spin mr-2">⟳</span>
        <span v-else>Open Project</span>
        <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        
        <!-- Shine effect -->
        <div class="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-20 w-1/2 skew-x-12"></div>
      </button>

      <p class="mt-6 text-xs text-gray-500">
        Requires a valid Git repository with vuepress-theme-plume
      </p>
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  100% {
    transform: translateX(200%);
  }
}
</style>
