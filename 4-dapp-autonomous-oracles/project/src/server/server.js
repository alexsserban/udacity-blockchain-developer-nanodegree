const FlightSuretyApp = require("../backend/build/contracts/FlightSuretyApp.json");
const FlightSuretyData = require("../backend/build/contracts/FlightSuretyData.json");

const Web3 = require("web3");
const express = require("express");
const Config = require("./config.json");

const config = Config["localhost"];
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace("http", "ws")));

const flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
const flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

const ORACLES_COUNT = 20;
const flightStatusCodes = [20];
// const flightStatusCodes = [0, 10, 20, 30, 40, 50];

let oracles = [];
let accounts;

const getRandom = (min, max) => Math.floor(Math.random() * (max - min) + min);

const registerOracles = async () => {
    const { REGISTRATION_FEE, registerOracle, getMyIndexes } = flightSuretyApp.methods;
    const fee = await REGISTRATION_FEE().call();

    let oracleOwner, indexes;
    for (let i = 1; i <= ORACLES_COUNT; i++) {
        oracleOwner = accounts[i];
        await registerOracle().send({ from: oracleOwner, value: fee, gas: "20000000" });
        indexes = await getMyIndexes().call({ from: oracleOwner });

        oracles.push({ owner: oracleOwner, indexes: [indexes[0], indexes[1], indexes[2]] });
        console.log(`Oracle Registered: ${indexes[0]}, ${indexes[1]}, ${indexes[2]}`);
    }
};

flightSuretyApp.events.OracleRequest(
    {
        fromBlock: 0,
    },
    async (error, event) => {
        if (error) {
            console.log(
                "\n----------------------------\n",
                "New Oracle Request ERROR:\n",
                error,
                "\n----------------------------\n"
            );
            return;
        }

        console.log(
            "\n----------------------------\n",
            "New Oracle Request Event:\n",
            event,
            "\n----------------------------\n"
        );

        if (!oracles.length) return;

        const { index, airline, flight, timestamp } = event.returnValues;
        for (let i = 0; i < ORACLES_COUNT; i++) {
            if (oracles[i].indexes.includes(index)) {
                const randomIndex = getRandom(0, flightStatusCodes.length);

                await flightSuretyApp.methods
                    .submitOracleResponse(index, airline, flight, parseInt(timestamp), flightStatusCodes[randomIndex])
                    .send({ from: oracles[i].owner, gas: "20000000" });
            }
        }
    }
);

const app = express();
app.get("/api", (req, res) => {
    res.send({
        message: "An API for use with your Dapp!",
    });
});

const main = async () => {
    await app.listen(3000, () => {
        console.log("Express app listening on port 3000.");
    });

    accounts = await web3.eth.getAccounts();

    registerOracles();
};

main();
