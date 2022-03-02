// Importing the StartNotary Smart Contract ABI (JSON representation of the Smart Contract)
const StarNotaryV1 = artifacts.require("StarNotaryV1.sol");

// This called the StartNotary Smart contract and initialize it
contract("StarNotaryV1", (accounts) => {
    const owner = accounts[0]; // Assigning the owner test account

    // Example test case, it will test if the contract is able to return the starName property
    // initialized in the contract constructor
    it("has correct name", async () => {
        const instance = await StarNotaryV1.deployed(); // Making sure the Smart Contract is deployed and getting the instance.
        const starName = await instance.starName(); // Calling the starName property
        assert.equal(starName, "Awesome Udacity Star"); // Assert if the starName property was initialized correctly
    });

    // Example test case, it will test is the Smart Contract function claimStar assigned the Star to the owner address
    it("can be claimed", async () => {
        const instance = await StarNotaryV1.deployed(); // Making sure the Smart Contract is deployed and getting the instance.
        await instance.claimStar({ from: owner }); // Calling the Smart Contract function claimStar
        const starOwner = await instance.starOwner(); // Getting the owner address
        assert.equal(starOwner, owner); // Verifying if the owner address match with owner of the address
    });

    // Example test case, it will test is the Smart Contract function claimStar assigned the Star to the owner address and it can be changed
    it("can change owners", async () => {
        const instance = await StarNotaryV1.deployed();
        const secondUser = accounts[1];

        await instance.claimStar({ from: owner });
        const starOwner = await instance.starOwner();
        assert.equal(starOwner, owner);

        await instance.claimStar({ from: secondUser });
        const secondOwner = await instance.starOwner.call();
        assert.equal(secondOwner, secondUser);
    });

    it("can change name", async () => {
        const instance = await StarNotaryV1.deployed();

        let starName = await instance.starName();
        assert.equal(starName, "Awesome Udacity Star");

        const newStarName = "New Star Name";
        await instance.changeStarName(newStarName);
        starName = await instance.starName();
        assert.equal(starName, newStarName);
    });
});
