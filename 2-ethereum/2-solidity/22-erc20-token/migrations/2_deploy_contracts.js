const Sampletoken = artifacts.require("Sampletoken");

module.exports = function (deployer) {
    deployer.deploy(Sampletoken);
};
