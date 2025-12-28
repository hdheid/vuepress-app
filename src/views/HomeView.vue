<script setup lang="ts">
import { ref } from 'vue';
import { open } from '@tauri-apps/plugin-dialog';
import { useRouter } from 'vue-router';
import { useProjectStore } from '../stores/project';
import { exists, readTextFile } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';

const router = useRouter();
const projectStore = useProjectStore();
const errorMsg = ref('');

async function openProject() {
  errorMsg.value = '';
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
        errorMsg.value = 'Not a git repository.';
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
             router.push('/editor');
        } else {
             errorMsg.value = 'vuepress-theme-plume not found in package.json';
        }
      } else {
          errorMsg.value = 'package.json not found.';
      }
    }
  } catch (err) {
    console.error(err);
    errorMsg.value = 'Error opening directory: ' + err;
  }
}
</script>

<template>
  <div class="h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4 glass">
    <h1 class="text-4xl font-thin mb-8">VuePress Plume Editor</h1>
    <button @click="openProject" class="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md transition border border-white/10 cursor-pointer">
      Open Project
    </button>
    <p v-if="errorMsg" class="mt-4 text-red-400 bg-black/50 p-2 rounded">{{ errorMsg }}</p>
  </div>
</template>

<style scoped>
.glass {
    background: radial-gradient(circle at top left, #1e293b, #0f172a);
}
</style>
