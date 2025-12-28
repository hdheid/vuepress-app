import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProjectStore = defineStore('project', () => {
  const projectPath = ref('')
  const isGitRepo = ref(false)
  const isVuePressThemePlume = ref(false)
  
  function setProject(path: string) {
    projectPath.value = path
  }

  return { projectPath, isGitRepo, isVuePressThemePlume, setProject }
})
