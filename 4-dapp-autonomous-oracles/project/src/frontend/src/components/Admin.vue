<template>
    <div class="w-1/2 p-8 mt-4 bg-slate-200">
        <div class="flex justify-between">
            <div class="flex items-center gap-3">
                <div class="w-4 h-4 rounded-full" :class="isOperational ? 'bg-green-600' : 'bg-red-600'"></div>

                <h2 class="text-2xl">Data Contract</h2>
            </div>

            <button class="btn" @click="switchDataContractStatus()">Switch Status</button>
        </div>

        <div>
            <p class="mt-6 mb-2 text-lg">App Contract</p>

            <div class="flex gap-4">
                <input
                    type="text"
                    minlength="42"
                    maxlength="42"
                    size="50"
                    class="input"
                    placeholder="Address"
                    v-model="appContractOwner"
                />

                <button class="btn" @click="authorizeAppContract()">Authorize</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const props = defineProps({ dataContract: Object });

const isOperational = ref(false);
const appContractOwner = ref("");

const authorizeAppContract = async () => {
    await props.dataContract.authorizeCaller(appContractOwner.value);
    appContractOwner.value = "";
};

const switchDataContractStatus = async () => await props.dataContract.setIsOperational(!isOperational.value);

onMounted(async () => {
    isOperational.value = await props.dataContract.getIsOperational();

    props.dataContract.on("ChangedOperatingStatus", (_isOperational) => {
        isOperational.value = _isOperational;
    });
});
</script>
