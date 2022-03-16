<template>
    <div class="w-1/2 p-8 mt-4 bg-slate-200">
        <h2 class="text-2xl">Passenger</h2>

        <p class="mt-6 mb-2 text-lg">Insurance</p>

        <div v-if="flights.length">
            <div class="flex gap-4">
                <select v-model="selectedFlight" class="input">
                    <option v-for="flight in flights" :value="flight">
                        {{ flight.name }}
                    </option>
                </select>

                <input type="number" class="input" placeholder="ETH" v-model="insuranceAmount" />

                <button
                    class="btn"
                    :class="selectedFlight[3] != 0 ? 'cursor-not-allowed hover:bg-slate-300' : ''"
                    @click="buyInsurance()"
                    :disabled="selectedFlight[3] != 0"
                >
                    Buy Insurance
                </button>

                <button class="btn" @click="checkFlightStatus()">Check Flight Status</button>

                <button class="btn" @click="withdraw()">Withdraw</button>
            </div>
            <div class="mt-4">
                <p>Airline: {{ selectedFlight[0] }}</p>

                <p>Time: {{ new Date(selectedFlight[2] * 1000) }}</p>

                <p>Status: {{ statusCodeDict[selectedFlight[3]] }}</p>
            </div>
        </div>

        <div v-else>
            <p>No flights available</p>
        </div>

        <button class="mt-2 btn" @click="getFlights()">Get Flights</button>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ethers } from "ethers";

const props = defineProps({ dataContract: Object, appContract: Object });

const flights = ref([]);
const selectedFlight = ref([]);
const insuranceAmount = ref(0);

const buyInsurance = async () => {
    await props.dataContract.buyInsurance(selectedFlight.value[0], selectedFlight.value[1], selectedFlight.value[2], {
        value: ethers.utils.parseEther(insuranceAmount.value.toString()),
    });
};

const checkFlightStatus = async () => {
    await props.appContract.fetchFlightStatus(
        selectedFlight.value[0],
        selectedFlight.value[1],
        selectedFlight.value[2]
    );
};

const withdraw = async () => {
    if (selectedFlight.value[3] != 20) {
        console.log("Status doesn't allow to withdraw");
        return;
    }

    await props.dataContract.payoutInsurance(selectedFlight.value[0], selectedFlight.value[1], selectedFlight.value[2]);
};

const getFlights = async () => {
    flights.value = await props.appContract.getFlights();
    selectedFlight.value = flights.value[0];
};

const statusCodeDict = {
    0: "UNKNOWN",
    10: "ON TIME",
    20: "LATE AIRLINE",
    30: "LATE WHEATER",
    40: "LATE TECHNICAL",
    50: "LATE OTHER",
};

onMounted(async () => {
    getFlights();

    props.dataContract.on("BoughtInsurance", (insureeAddress) => {
        console.log(`${insureeAddress} bought insurance`);
    });

    props.dataContract.on("PaidInsuree", (insureeAddress) => {
        console.log(`Payout insurance for ${insureeAddress}`);
    });

    props.appContract.on("FlightStatusInfo", async (airline, flight, timestamp, statusCode) => {
        console.log("New Flight Status Info", airline, flight, timestamp.toString(), statusCode);

        getFlights();
    });
});
</script>
