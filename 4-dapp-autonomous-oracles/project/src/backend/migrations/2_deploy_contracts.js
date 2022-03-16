const fs = require("fs");

const FlightSuretyData = artifacts.require("FlightSuretyData");
const FlightSuretyApp = artifacts.require("FlightSuretyApp");

module.exports = async function (deployer) {
    const firstAirline = "0x34Dd1d77605675c232F4a5270Ac59F19c9d90C7c";
    await deployer.deploy(FlightSuretyData, firstAirline, "first");
    await deployer.deploy(FlightSuretyApp, FlightSuretyData.address);

    const config = {
        localhost: {
            url: "http://localhost:7545",
            dataAddress: FlightSuretyData.address,
            appAddress: FlightSuretyApp.address,
        },
    };

    fs.writeFileSync(__dirname + "/../../frontend/config.json", JSON.stringify(config, null, "\t"), "utf-8");
    fs.writeFileSync(__dirname + "/../../server/config.json", JSON.stringify(config, null, "\t"), "utf-8");
};
