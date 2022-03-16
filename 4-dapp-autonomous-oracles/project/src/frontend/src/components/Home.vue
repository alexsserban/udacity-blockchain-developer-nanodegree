<template>
    <div class="flex flex-col items-center">
        <div class="w-1/2 p-8 bg-slate-200">
            <h1 class="text-4xl text-center">Flight Surety</h1>
        </div>

        <Admin :dataContract="dataContract" />

        <Airline :dataContract="dataContract" :appContract="appContract" />

        <Passenger :dataContract="dataContract" :appContract="appContract" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ethers } from "ethers";

import Admin from "./Admin.vue";
import Airline from "./Airline.vue";
import Passenger from "./Passenger.vue";

import FlightSuretyData from "../../../backend/build/contracts/FlightSuretyData.json";
import FlightSuretyApp from "../../../backend/build/contracts/FlightSuretyApp.json";
import Config from "../../config.json";

const provider = new ethers.providers.Web3Provider(window.ethereum);
provider.send("eth_requestAccounts", []);
const signer = provider.getSigner();

const config = Config["localhost"];
const appContract = new ethers.Contract(config.appAddress, FlightSuretyApp.abi, signer);
const dataContract = new ethers.Contract(config.dataAddress, FlightSuretyData.abi, signer);

const account = ref("");

onMounted(async () => {
    const accounts = await provider.listAccounts();
    account.value = accounts[0];

    window.ethereum.on("accountsChanged", (accounts) => {
        account.value = accounts[0];
        console.log("Account changed to: ", accounts[0]);
    });
});
</script>
