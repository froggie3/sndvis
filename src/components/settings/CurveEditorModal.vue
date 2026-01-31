<template>
    <div class="tf-modal-overlay">
        <div class="tf-modal">
            <div class="tf-header">
                <strong>{{ title }}</strong>
                <button class="close-btn" @click="$emit('close')">Close</button>
            </div>
            <div class="tf-body">
                <TransferFunctionEditor 
                    v-if="activeConfig"
                    :modelValue="activeConfig"
                    @update:modelValue="onUpdate" 
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import TransferFunctionEditor from '../TransferFunctionEditor.vue';
import type { TransferFunctionConfig } from '../../domain/transfer-function';

const props = defineProps<{
    title: string;
    activeConfig: TransferFunctionConfig | undefined;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'update', val: TransferFunctionConfig): void;
}>();

function onUpdate(val: TransferFunctionConfig) {
    emit('update', val);
}

</script>

<style scoped>
.tf-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.tf-modal {
    background: #2a2a35;
    border: 1px solid #444;
    border-radius: 8px;
    width: 350px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
}

.tf-header {
    background: rgba(0,0,0,0.2);
    padding: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #444;
}

.tf-body {
    padding: 10px;
}

.close-btn {
    background: transparent;
    border: 1px solid #666;
    color: #ccc;
    font-size: 0.8em;
    cursor: pointer;
    padding: 2px 8px;
    border-radius: 4px;
}
</style>
