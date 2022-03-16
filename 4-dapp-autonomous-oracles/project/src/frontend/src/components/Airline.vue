<template>
    <div class="bg-slate-200 p-8 w-1/2 mt-4">
        <h2 class="text-2xl">Airline</h2>

        <div>
            <p class="text-lg mt-6 mb-2">Register Airline</p>

            <div class="flex gap-4">
                <input
                    type="text"
                    minlength="42"
                    maxlength="42"
                    size="50"
                    class="input"
                    placeholder="Address"
                    v-model="newAirline.address"
                />

                <input type="text" size="30" class="input" placeholder="Name" v-model="newAirline.name" />

                <button class="btn" @click="registerAirline()">Register</button>
            </div>
        </div>

        <div>
            <p class="text-lg mt-6 mb-2">Fund Airline</p>

            <div class="flex gap-4">
                <input type="number" class="input" placeholder="ETH" v-model="fundAmount" />

                <button class="btn" @click="fund()">Fund</button>
            </div>
        </div>

        <div>
            <p class="text-lg mt-6 mb-2">Approve Airline</p>

            <div class="flex gap-4">
                <input
                    type="text"
                    minlength="42"
                    maxlength="42"
                    size="50"
                    class="input"
                    placeholder="Address"
                    v-model="approvedAirline"
                />

                <button class="btn" @click="approve()">Approve</button>
            </div>
        </div>

        <div>
            <p class="text-lg mt-6 mb-2">Register flight</p>

            <div class="flex gap-4">
                <input
                    type="text"
                    minlength="42"
                    maxlength="42"
                    size="50"
                    class="input"
                    placeholder="Name"
                    v-model="newFlight.name"
                />

                <input type="text" size="30" class="input" placeholder="Time" v-model="newFlight.timestamp" />

                <button class="btn" @click="registerFlight()">Register</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { ethers } from "ethers";

const props = defineProps({ dataContract: Object, appContract: Object });

// Register new airline
const newAirline = reactive({
    address: "",
    name: "",
});

const registerAirline = async () => {
    await props.appContract.registerAirline(newAirline.address, newAirline.name);

    newAirline.address = "";
    newAirline.name = "";
};

// Fund airline
const fundAmount = ref(null);
const fund = async () => {
    await props.dataContract.fund({ value: ethers.utils.parseEther(fundAmount.value.toString()) });
};

const approvedAirline = ref("");
const approve = async () => await props.appContract.approveAirlineRegistration(approvedAirline.value);

// Register new flight
const newFlight = reactive({
    name: "",
    timestamp: "",
});

const registerFlight = async () => await props.appContract.registerFlight(newFlight.name, newFlight.timestamp);

onMounted(async () => {
    props.appContract.on("RegisteredAirline", (airlineAddress) => {
        console.log("New Registered Airline: ", airlineAddress);
    });

    props.appContract.on("NewAirlineVoting", (airlineAddress) => {
        console.log("New Airline Voting Started: ", airlineAddress);
    });

    props.appContract.on("VotedAirlineRegistration", (airlineAddress, approvedAirlineAddress) => {
        console.log(`Airline ${airlineAddress} approved registration for airline: ${airlineAddress}`);
    });

    props.dataContract.on("FundedAirline", (airlineAddress) => {
        console.log(`Airline ${airlineAddress} is funded`);
    });

    props.appContract.on("RegisteredFlight", (airlineAddress, name, timestamp) => {
        const date = new Date(timestamp * 1000);
        console.log(`Airline ${airlineAddress} registered flight ${name} at ${date}`);
    });
});
</script>
