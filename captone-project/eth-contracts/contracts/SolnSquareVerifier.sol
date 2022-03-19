// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./UdacityCapstoneToken.sol";

interface IVerifier {
    struct G1Point {
        uint256 X;
        uint256 Y;
    }
    struct G2Point {
        uint256[2] X;
        uint256[2] Y;
    }

    struct Proof {
        G1Point a;
        G2Point b;
        G1Point c;
    }

    function verifyTx(Proof memory proof, uint256[1] memory input)
        external
        view
        returns (bool r);
}

contract SolnSquareVerifier is UdacityCapstoneToken {
    IVerifier verifier;

    mapping(bytes32 => address) uniqueSolutions;

    event SolutionAdded(address solutioner);

    constructor(address verifierAddress) {
        verifier = IVerifier(verifierAddress);
    }

    function mintNewNFT(
        address to,
        string memory uri,
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[1] memory input
    ) public payable {
        IVerifier.Proof memory proof = IVerifier.Proof(
            IVerifier.G1Point(a[0], a[1]),
            IVerifier.G2Point(b[0], b[1]),
            IVerifier.G1Point(c[0], c[1])
        );

        require(verifier.verifyTx(proof, input), "Solution is not verified");

        bytes32 hash = keccak256(abi.encodePacked(a, b, c, input));

        require(
            uniqueSolutions[hash] == address(0),
            "Solution already submitted"
        );

        safeMint(to, uri);

        _addSolution(hash);
    }

    function _addSolution(bytes32 hash) internal {
        uniqueSolutions[hash] = msg.sender;
        emit SolutionAdded(msg.sender);
    }
}
