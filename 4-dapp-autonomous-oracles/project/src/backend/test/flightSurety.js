const truffleAssert = require("truffle-assertions");

const FlightSuretyData = artifacts.require("FlightSuretyData");
const FlightSuretyApp = artifacts.require("FlightSuretyApp");

contract("Flight Surety", async (accounts) => {
    const baseAirlineName = "Airline-";
    const fundingEthers = web3.utils.toWei("10", "ether");
    const insuranceEthers = web3.utils.toWei("2", "ether");
    const maxInsuranceEthers = web3.utils.toWei("1", "ether");

    const airlines = [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5], accounts[6]];
    const users = [accounts[11]];

    const flight = {
        airline: airlines[0],
        name: "Flight001",
        timestamp: 1647369158,
    };

    const TEST_ORACLES_COUNT = 20;

    const STATUS_CODE_UNKNOWN = 0;
    const STATUS_CODE_ON_TIME = 10;
    const STATUS_CODE_LATE_AIRLINE = 20;
    const STATUS_CODE_LATE_WEATHER = 30;
    const STATUS_CODE_LATE_TECHNICAL = 40;
    const STATUS_CODE_LATE_OTHER = 50;

    let flightSuretyData, flightSuretyApp;

    before("setup contract", async () => {
        flightSuretyData = await FlightSuretyData.new(accounts[1], "Airline-01");
        flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);

        await flightSuretyData.authorizeCaller(flightSuretyApp.address);
    });

    it(`is deployed as operational`, async function () {
        let status = await flightSuretyData.getIsOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");
    });

    it(`blocks access to setIsOperational() for non-Contract Owner account`, async function () {
        let accessDenied = false;

        try {
            await flightSuretyData.setIsOperational(false, { from: airlines[0] });
        } catch (e) {
            accessDenied = true;
        }

        assert.equal(accessDenied, true, "Access not restricted to only Contract Owner");
    });

    it(`allows access to setIsOperational() for Contract Owner account`, async function () {
        let accessDenied = false;

        try {
            await flightSuretyData.setIsOperational(false);
        } catch (e) {
            accessDenied = true;
        }

        assert.equal(accessDenied, false, "Contract Owner is not allowed.");
    });

    it(`adds first Airline on deployment`, async function () {
        const airlineOwnersCount = await flightSuretyData.getAirlineOwnersCount.call();
        assert.equal(airlineOwnersCount, 1, "First Airline was not added on deployment.");

        const firstAirlineAddress = await flightSuretyData.airlineOwners.call(0);
        assert.equal(firstAirlineAddress, airlines[0], "First Airline address is not correct");

        const firstAirline = await flightSuretyData.airlines.call(firstAirlineAddress);
        assert.equal(firstAirline.name, baseAirlineName + "01", "First Airline name is not correct");
        assert.equal(firstAirline.isFunded, false, "First Airline should not been funded");
        assert.equal(firstAirline.listPointer.toString(), 0, "First Airline list pointer is not correct");

        const isAirline = await flightSuretyData.isAirline.call(firstAirlineAddress);
        assert.equal(isAirline, true, "Address is not Airline");

        const isFundedAirline = await flightSuretyData.isFundedAirline.call(firstAirlineAddress);
        assert.equal(isFundedAirline, false, "Airline is already funded");
    });

    it(`can block access when operating status is false`, async function () {
        await flightSuretyData.setIsOperational(false);

        let reverted = false;
        try {
            await flightSuretyApp.registerAirline(airlines[1], baseAirlineName + "02", { from: airlines[0] });
        } catch (e) {
            reverted = true;
        }
        assert.equal(reverted, true, "Access not blocked for requireIsOperational");

        await flightSuretyData.setIsOperational(true);
    });

    it("(airline) cannot register an Airline if it is not funded", async () => {
        let reverted = false;

        try {
            await flightSuretyApp.registerAirline(airlines[1], baseAirlineName + "02", { from: airlines[0] });
        } catch (err) {
            reverted = true;
        }

        assert.equal(reverted, true, "Not funded Airline Registered an Airline");
    });

    it("(airline) can fund insurance", async () => {
        // Check initial state
        let airline = await flightSuretyData.airlines.call(airlines[0], { from: airlines[0] });
        assert.equal(airline.funds.toString(), "0", "Airline already funded some amount.");

        let airlineBalanceBefore = await web3.eth.getBalance(airlines[0]);
        let flightSuretyDataBalanceBefore = await web3.eth.getBalance(flightSuretyData.address);

        // Fund
        await flightSuretyData.fund({ from: airlines[0], value: fundingEthers, gasPrice: 0 });

        let airlineBalanceAfter = await web3.eth.getBalance(airlines[0]);
        let flightSuretyDataBalanceAfter = await web3.eth.getBalance(flightSuretyData.address);

        // Check Airline balance
        assert.equal(
            Number(airlineBalanceBefore) - Number(airlineBalanceAfter),
            fundingEthers,
            "Airline doesn't have the correct balance"
        );

        // Check data contract balance
        assert.equal(
            Number(flightSuretyDataBalanceAfter) - Number(flightSuretyDataBalanceBefore),
            fundingEthers,
            "Owner doesn't have the correct balance"
        );

        // Check data contract infos about Airline
        airline = await flightSuretyData.airlines.call(airlines[0], { from: airlines[0] });
        assert.equal(airline.funds.toString(), fundingEthers, "Contract didn't stored the correct funding amount");
        assert.equal(airline.isFunded, true, "Airline isn't funded");

        // Check total number of funded Airlines
        const fundedAirlinesCount = await flightSuretyData.getFundedAirlinesCount.call();
        assert.equal(fundedAirlinesCount, 1);
    });

    it("(airline) can register an Airline", async () => {
        const result = await flightSuretyApp.registerAirline(airlines[1], baseAirlineName + "02", {
            from: airlines[0],
        });

        // Check emitted event
        truffleAssert.eventEmitted(result, "RegisteredAirline", (ev) => ev.airlineAddress == airlines[1]);

        // Check Airline was added
        const airlineOwnersCount = await flightSuretyData.getAirlineOwnersCount.call();
        assert.equal(airlineOwnersCount, 2, "New airline isn't registered");
    });

    it("(airline) can't be registered twice", async () => {
        let reverted = false;
        try {
            await flightSuretyApp.registerAirline(airlines[1], baseAirlineName + "02", { from: airlines[0] });
        } catch (error) {
            reverted = true;
        }

        assert.equal(reverted, true, "Airline got registered twice");
    });

    it("can't have more than 5 Airlines without needing approval", async () => {
        let result;

        // Register 3rd Airline
        result = await flightSuretyApp.registerAirline(airlines[2], baseAirlineName + "03", { from: airlines[0] });
        truffleAssert.eventEmitted(result, "RegisteredAirline", (ev) => ev.airlineAddress == airlines[2]);

        // Register 4th Airline
        result = await flightSuretyApp.registerAirline(airlines[3], baseAirlineName + "04", { from: airlines[0] });
        truffleAssert.eventEmitted(result, "RegisteredAirline", (ev) => ev.airlineAddress == airlines[3]);

        // Register 5th Airline with approval from 1/1 funded airlines
        result = await flightSuretyApp.registerAirline(airlines[4], baseAirlineName + "05", { from: airlines[0] });
        truffleAssert.eventEmitted(result, "RegisteredAirline", (ev) => ev.airlineAddress == airlines[4]);

        // Add funds from 2nd Airline
        await flightSuretyData.fund({ from: airlines[1], value: fundingEthers, gasPrice: 0 });

        // Check total number of funded Airlines
        const fundedAirlinesCount = await flightSuretyData.getFundedAirlinesCount.call();
        assert.equal(fundedAirlinesCount, 2);

        // Adding a 6th Airlines waits for approval from > 50% of funded Airlines
        result = await flightSuretyApp.registerAirline(airlines[5], baseAirlineName + "06", { from: airlines[0] });
        truffleAssert.eventEmitted(result, "NewAirlineVoting", (ev) => ev.airlineAddress == airlines[5]);

        // Check Airlines count
        const airlineOwnersCount = await flightSuretyData.getAirlineOwnersCount.call();
        assert.equal(airlineOwnersCount, 5, "Not expected number of Airlines");
    });

    it("(airline) can't vote twice for a new register", async () => {
        let reverted = false;
        try {
            await flightSuretyApp.approveAirlineRegistration(airlines[5], { from: airlines[0] });
        } catch (error) {
            reverted = true;
        }

        assert.equal(reverted, true, "Can't vote twice");
    });

    it("(airline) can vote to register new Airline", async () => {
        // Add funds for 2 more Airlines
        await flightSuretyData.fund({ from: airlines[2], value: fundingEthers, gasPrice: 0 });
        await flightSuretyData.fund({ from: airlines[3], value: fundingEthers, gasPrice: 0 });

        // Check total number of funded Airlines
        const fundedAirlinesCount = await flightSuretyData.getFundedAirlinesCount.call();
        assert.equal(fundedAirlinesCount, 4);

        // Approve 2/4 (3 needed to pass)
        await flightSuretyApp.approveAirlineRegistration(airlines[5], { from: airlines[1] });

        // Check total number of Airlines
        let airlinesCount = await flightSuretyData.getAirlineOwnersCount.call();
        assert.equal(airlinesCount, 5);

        // Approve 3/4 (3 needed to pass)
        const result = await flightSuretyApp.approveAirlineRegistration(airlines[5], { from: airlines[2] });
        truffleAssert.eventEmitted(result, "RegisteredAirline", (ev) => ev.airlineAddress == airlines[5]);

        // Check total number of Airlines
        airlinesCount = await flightSuretyData.getAirlineOwnersCount.call();
        assert.equal(airlinesCount, 6);

        // Check that voting is finished
        let reverted = false;
        try {
            await flightSuretyApp.approveAirlineRegistration(airlines[5], { from: airlines[1] });
        } catch (error) {
            reverted = true;
        }

        assert.equal(reverted, true, "Voting should't be available");
    });

    it("(airline) can register flight", async () => {
        await flightSuretyApp.registerFlight(flight.name, flight.timestamp, { from: flight.airline });
        const flights = await flightSuretyApp.getFlights();

        assert.equal(flights.length, 1, "Not the expected amount of flights");
        assert.equal(flights[0].airline, flight.airline, "Incorrect Airline");
        assert.equal(flights[0].name, flight.name, "Incorrect Name");
        assert.equal(flights[0].timestamp, flight.timestamp, "Incorrect Timemstamp");
        assert.equal(flights[0].statusCode, 0, "Incorrect Status Code");
    });

    it("(user) ca buy insurance", async () => {
        let flightSuretyDataBalanceBefore = await web3.eth.getBalance(flightSuretyData.address);
        let userBalanceBefore = await web3.eth.getBalance(users[0]);

        const result = await flightSuretyData.buyInsurance(flight.airline, flight.name, flight.timestamp, {
            from: users[0],
            value: insuranceEthers,
            gasPrice: 0,
        });

        truffleAssert.eventEmitted(result, "BoughtInsurance", (ev) => ev.insuree == users[0]);

        let flightSuretyDataBalanceAfter = await web3.eth.getBalance(flightSuretyData.address);
        let userBalanceAfter = await web3.eth.getBalance(users[0]);

        // Check data contract balance
        assert.equal(
            Number(flightSuretyDataBalanceAfter) - Number(flightSuretyDataBalanceBefore),
            maxInsuranceEthers,
            "Data contract doesn't have the expected amount"
        );

        // Check user balance
        assert.equal(
            Number(userBalanceBefore) - Number(userBalanceAfter),
            maxInsuranceEthers,
            "User doesn't have the expected amount"
        );

        // Check if the user can buy another insurance
        let reverted = false;
        try {
            await flightSuretyData.buyInsurance(flight.airline, flight.name, flight.timestamp, {
                from: users[0],
                value: insuranceEthers,
                gasPrice: 0,
            });
        } catch (error) {
            reverted = true;
        }

        assert.equal(reverted, true, "User shouldn't be able to buy insurance multiple times");
    });

    it("can register oracles", async () => {
        const fee = await flightSuretyApp.REGISTRATION_FEE.call();

        for (let i = 1; i <= TEST_ORACLES_COUNT; i++) {
            await flightSuretyApp.registerOracle({ from: accounts[i], value: fee });
            let result = await flightSuretyApp.getMyIndexes.call({ from: accounts[i] });
            // console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
        }
    });

    it("can request flight status", async () => {
        await flightSuretyApp.fetchFlightStatus(flight.airline, flight.name, flight.timestamp);
        let result;
        let emittedEvent = false;

        for (let i = 1; i < TEST_ORACLES_COUNT; i++) {
            let oracleIndexes = await flightSuretyApp.getMyIndexes.call({ from: accounts[i] });

            for (let idx = 0; idx < 3; idx++) {
                try {
                    result = await flightSuretyApp.submitOracleResponse(
                        oracleIndexes[idx],
                        flight.airline,
                        flight.name,
                        flight.timestamp,
                        STATUS_CODE_LATE_AIRLINE,
                        { from: accounts[i] }
                    );

                    if (result.logs[0]?.event == "FlightStatusInfo" || result.logs[1]?.event == "FlightStatusInfo") {
                        emittedEvent = true;
                    }
                } catch (e) {
                    // console.log("\nError", idx, oracleIndexes[idx].toNumber(), flight, timestamp);
                }
            }
        }

        assert.equal(emittedEvent, true, "Nope");
    });

    it("(user) can get payout insurance", async () => {
        const userBalanceBefore = await web3.eth.getBalance(users[0]);

        await flightSuretyData.payoutInsurance(flight.airline, flight.name, flight.timestamp, {
            from: users[0],
            gasPrice: 0,
        });

        const userBalanceAfter = await web3.eth.getBalance(users[0]);

        assert.equal(
            Number(userBalanceAfter) - Number(userBalanceBefore),
            maxInsuranceEthers * 1.5,
            "User didn't receivede the correct amount of money back."
        );
    });
});
