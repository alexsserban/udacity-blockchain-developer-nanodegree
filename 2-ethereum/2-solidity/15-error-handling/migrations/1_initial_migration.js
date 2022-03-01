const Modifiers = artifacts.require("Modifiers");

module.exports = function (deployer) {
    deployer.deploy(Modifiers, 30);
};
