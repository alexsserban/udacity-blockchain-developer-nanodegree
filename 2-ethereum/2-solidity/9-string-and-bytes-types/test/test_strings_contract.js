const TestStringsContract = artifacts.require("TestStringsContract");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("TestStringsContract", function (/* accounts */) {
  it("should assert true", async function () {
    await TestStringsContract.deployed();
    return assert.isTrue(true);
  });
});
