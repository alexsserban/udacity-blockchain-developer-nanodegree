const StarNotary = artifacts.require("StarNotary");

contract("StarNotary", (accounts) => {
    const user = accounts[0],
        user1 = accounts[1],
        starName = "Awesome Star!",
        starPrice = web3.utils.toWei(".01", "ether"),
        balance = web3.utils.toWei(".05", "ether");
    let contract,
        starId = 0;

    beforeEach("should setup the contract", async () => {
        contract = await StarNotary.new();
    });

    it("can create a star", async () => {
        await contract.createStar(starName, { from: user });

        const actualStartName = await contract.tokenIdToStarInfo.call(starId);
        assert.equal(starName, actualStartName);
    });

    it("can put up star for sale", async () => {
        await contract.createStar(starName, { from: user });
        await contract.putStarUpForSale(starId, starPrice, { from: user });
        assert.equal(await contract.starsForSale.call(starId), starPrice);
    });

    it("lets user get the funds after the sale", async () => {
        await contract.createStar(starName, { from: user });
        await contract.putStarUpForSale(starId, starPrice, { from: user });

        const balanceOfUserBeforeTransaction = await web3.eth.getBalance(user);
        await contract.buyStar(starId, { from: user1, value: balance });
        const balanceOfUserAfterTransaction = await web3.eth.getBalance(user);

        const value1 = Number(balanceOfUserBeforeTransaction) + Number(starPrice);
        const value2 = Number(balanceOfUserAfterTransaction);
        assert.equal(value1, value2);
    });

    it("lets user1 buy a star, if it is put up for sale", async () => {
        await contract.createStar(starName, { from: user });
        await contract.putStarUpForSale(starId, starPrice, { from: user });
        await contract.buyStar(starId, { from: user1, value: balance });

        assert.equal(await contract.ownerOf.call(starId), user1);
    });

    it("lets user1 buy a star and decreases its balance in ether", async () => {
        await contract.createStar(starName, { from: user });
        await contract.putStarUpForSale(starId, starPrice, { from: user });

        const balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
        await contract.buyStar(starId, { from: user1, value: balance, gasPrice: 0 });
        const balanceAfterUser1BuysStar = await web3.eth.getBalance(user1);

        const value = Number(balanceOfUser1BeforeTransaction) - Number(balanceAfterUser1BuysStar);
        assert.equal(value, starPrice);
    });

    it("can add the token name and symbol properly", async () => {
        const tokenName = await contract.name();
        assert.equal(tokenName, "StarNotary");

        const tokenSymbol = await contract.symbol();
        assert.equal(tokenSymbol, "SNA");
    });

    it("lets 2 users exchange stars", async () => {
        await contract.createStar(starName, { from: user });
        await contract.createStar("Second Star!", { from: user1 });

        // Check initial ownership of stars
        assert.equal(await contract.ownerOf(0), user);
        assert.equal(await contract.ownerOf(1), user1);

        await contract.exchangeStars(0, 1, { from: user });

        // Check ownership of stars after exchange
        assert.equal(await contract.ownerOf(0), user1);
        assert.equal(await contract.ownerOf(1), user);
    });

    it("lets a user transfer a star", async () => {
        await contract.createStar(starName, { from: user });

        // Check initial ownership
        assert.equal(await contract.ownerOf(0), user);

        await contract.transferStar(user1, 0);

        // Check ownership after transfer
        assert.equal(await contract.ownerOf(0), user1);
    });

    it("can get star", async () => {
        await contract.createStar(starName, { from: user });
        const actualStarName = await contract.tokenIdToStarInfo(0);
        assert.equal(starName, actualStarName);
    });
});
