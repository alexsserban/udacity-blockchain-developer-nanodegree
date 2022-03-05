const Fundraiser = artifacts.require("Fundraiser");

module.exports = function (deployer) {
    deployer.deploy(Fundraiser, { value: 200 });
};
