<script setup lang="ts">
import { useToastStore } from '../stores/toast';
import { X } from 'lucide-vue-next';

const toastStore = useToastStore();

const typeClasses = {
  success: 'bg-green-500/20 border-green-500/50 text-green-200',
  error: 'bg-red-500/20 border-red-500/50 text-red-200',
  info: 'bg-blue-500/20 border-blue-500/50 text-blue-200',
  warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200',
};
</script>

<template>
  <div class="fixed top-4 right-4 z-[100] flex flex-col space-y-2 pointer-events-none">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="pointer-events-auto backdrop-blur-md border rounded-lg shadow-lg p-3 pr-8 min-w-[300px] relative flex items-center transition-all duration-300"
        :class="typeClasses[toast.type]"
      >
        <span class="text-sm font-medium">{{ toast.message }}</span>
        <button 
            @click="toastStore.remove(toast.id)" 
            class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
        >
            <X :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
