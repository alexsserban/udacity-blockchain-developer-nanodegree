const Wallet = artifacts.require("Wallet");

module.exports = function (deployer) {
    deployer.deploy(Wallet, "0x0eFb8FEE2E0436a07baA10C8b5C4d77ce657D284", { value: 200 });
};
