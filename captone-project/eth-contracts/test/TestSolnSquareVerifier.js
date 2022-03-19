const Verifier = artifacts.require("Verifier");
const SolnSquareVerifier = artifacts.require("SolnSquareVerifier");

const proof = require("../../zokrates/proof.json");

contract("TestUdacityCapstoneToken", (accounts) => {
    let contract;

    before(async () => {
        verifierContract = await Verifier.new();
        contract = await SolnSquareVerifier.new(verifierContract.address);
    });

    // it("should add new solution", async () => {});

    it("should mint new NFT", async () => {
        const {
            proof: { a, b, c },
            inputs,
        } = proof;

        await contract.mintNewNFT(accounts[1], "1", a, b, c, inputs);

        const count = await contract.count.call();
        assert.equal(count, 1, "It should be one NFT minted.");

        const owner = await contract.ownerOf(0);
        assert.equal(owner, accounts[1], "Not the expected owner");
    });
});
