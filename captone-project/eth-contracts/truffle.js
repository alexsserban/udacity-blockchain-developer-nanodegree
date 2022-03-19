require("dotenv").config();

const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
    networks: {
        development: {
            host: "127.0.0.1", // Localhost (default: none)
            port: 7545, // Standard Ethereum port (default: none)
            network_id: "*", // Any network (default: none)
        },

        rinkeby: {
            provider: () =>
                new HDWalletProvider({
                    privateKeys: [process.env.PRIVATE_KEY],
                    providerOrUrl: `https://rinkeby.infura.io/v3/${process.env.INFURA_ID}`,
                }),
            network_id: 4,
            from: process.env.PUBLIC_KEY,
        },
    },

    mocha: {},

    compilers: {
        solc: {
            version: "0.8.13",
        },
    },
};
