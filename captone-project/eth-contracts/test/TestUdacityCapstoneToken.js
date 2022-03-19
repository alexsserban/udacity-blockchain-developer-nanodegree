const { expectRevert } = require("@openzeppelin/test-helpers");
const UdacityCapstoneToken = artifacts.require("UdacityCapstoneToken");

contract("TestUdacityCapstoneToken", (accounts) => {
    let contract;

    describe("match erc721 spec", () => {
        beforeEach(async () => {
            contract = await UdacityCapstoneToken.new();

            for (let i = 0; i < 5; i++) {
                await contract.safeMint(accounts[0], `${i}`);
            }
        });

        it("should return total supply", async () => {
            const totalSupply = await contract.totalSupply.call();
            assert.equal(totalSupply, 5);
        });

        it("should get token balance", async () => {
            const ownerBalance = await contract.balanceOf(accounts[0]);
            assert.equal(ownerBalance, 5);
        });

        it("should return token uri", async () => {
            const uri = await contract.tokenURI(0);
            assert.equal(uri, "https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/" + "0");
        });

        it("should transfer token from one owner to another", async () => {
            const tokenID = 0;
            let owner = await contract.ownerOf(tokenID);
            assert.equal(owner, accounts[0]);

            await contract.safeTransferFrom(accounts[0], accounts[1], tokenID);

            owner = await contract.ownerOf(tokenID);
            assert.equal(owner, accounts[1]);
        });
    });

    describe("have ownership properties", () => {
        beforeEach(async () => {
            contract = await UdacityCapstoneToken.new();
        });

        it("should fail when minting when address is not contract owner", async () => {
            await expectRevert(
                contract.safeMint(accounts[1], "0", { from: accounts[1] }),
                "Ownable: caller is not the owner"
            );
        });

        it("should return contract owner", async () => {
            const owner = await contract.owner.call();
            assert.equal(owner, accounts[0]);
        });
    });
});
