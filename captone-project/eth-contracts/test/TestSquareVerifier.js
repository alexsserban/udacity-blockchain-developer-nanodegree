const { expectRevert } = require("@openzeppelin/test-helpers");

const Verifier = artifacts.require("Verifier");
const proof = require("../../zokrates/proof.json");

contract("TestUdacityCapstoneToken", (accounts) => {
    let contract;

    before(async () => {
        contract = await Verifier.new();
    });

    it("should succeed verification with correct proof", async () => {
        const success = await contract.verifyTx(proof.proof, proof.inputs);
        assert.equal(success, true, "Didn't succeed the verification");
    });

    it("should fail verification with incorrect proof", async () => {
        const modifiedProof = proof.proof;
        modifiedProof.a[0] = modifiedProof.a[0].slice(0, -5) + "aaaaa";

        await expectRevert.assertion(contract.verifyTx(modifiedProof, proof.inputs), "Succeeded the verification");
    });
});
