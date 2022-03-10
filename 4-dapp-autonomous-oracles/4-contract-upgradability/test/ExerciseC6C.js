var Test = require("../config/testConfig.js");

contract("ExerciseC6C", async (accounts) => {
    var config;
    before("setup contract", async () => {
        config = await Test.Config(accounts);
    });

    it("can register Employee, add sale and calculate bonus", async () => {
        let employee = {
            id: "test1",
            isAdmin: false,
            address: config.testAddresses[0],
        };
        let sale = 400;
        let expectedBonus = parseInt(sale * 0.07);

        // Authorize the App Contract to use the Data Contract
        await config.exerciseC6C.authorizeContract(config.exerciseC6CApp.address);

        // Register Employee
        await config.exerciseC6C.registerEmployee(employee.id, employee.isAdmin, employee.address);

        // Use app contract to modify data
        await config.exerciseC6CApp.addSale(employee.id, 400);

        let bonus = await config.exerciseC6C.getEmployeeBonus.call(employee.id);
        assert.equal(bonus.toNumber(), expectedBonus, "Calculated bonus is incorrect incorrect");
    });
});
