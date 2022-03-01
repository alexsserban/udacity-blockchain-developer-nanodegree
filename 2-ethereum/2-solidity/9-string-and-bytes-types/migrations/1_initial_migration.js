const StringsContract = artifacts.require("StringsContract");

module.exports = function (deployer) {
    deployer.deploy(StringsContract);
};
