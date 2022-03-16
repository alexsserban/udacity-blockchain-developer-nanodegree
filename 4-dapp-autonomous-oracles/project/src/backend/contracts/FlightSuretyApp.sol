// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../node_modules/openzeppelin-solidity/contracts/utils/math/SafeMath.sol";

interface IFlightSuretyData {
    function getIsOperational() external view returns (bool);

    function isAirline(address _airlineAddress) external view returns (bool);

    function isFundedAirline(address _airlineAddress)
        external
        view
        returns (bool);

    function getAirlineOwnersCount() external view returns (uint256);

    function getFundedAirlinesCount() external view returns (uint256);

    function registerAirline(
        address _airlineAddress,
        string memory _airlineName
    ) external;

    function creditInsurees(bytes32 _flightKey) external;
}

contract FlightSuretyApp {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codes
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    uint8 private constant MAX_AIRLINES_WITHOUT_VOTING = 4;

    address private contractOwner;
    IFlightSuretyData flightSuretyData;

    struct Flight {
        address airline;
        string name;
        uint256 timestamp;
        uint8 statusCode;
    }

    Flight[] private flights;

    struct NewAirline {
        string name;
        mapping(address => bool) voters; // Airlines who voted already
        uint256 votes; // Total votes
    }

    mapping(address => NewAirline) newAirlines;

    /********************************************************************************************/
    /*                                       EVENTS                                             */
    /********************************************************************************************/

    event RegisteredAirline(address airlineAddress);
    event NewAirlineVoting(address airlineAddress);
    event VotedAirlineRegistration(
        address airlineAddress,
        address approvedAirlineAddress
    );
    event RegisteredFlight(
        address airlineAddress,
        string name,
        uint256 timestamp
    );

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    constructor(address _dataContract) {
        contractOwner = msg.sender;
        flightSuretyData = IFlightSuretyData(_dataContract);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    modifier operational() {
        require(
            flightSuretyData.getIsOperational(),
            "Contract is currently not operational"
        );
        _;
    }

    modifier onlyFundedAirline() {
        require(
            flightSuretyData.isFundedAirline(msg.sender),
            "Caller is not a funded Airline"
        );
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function getFlightKey(
        address _airline,
        string memory _flight,
        uint256 _timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_airline, _flight, _timestamp));
    }

    function getFlights() external view returns (Flight[] memory) {
        return flights;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function registerAirline(
        address _airlineAddress,
        string memory _airlineName
    ) external operational onlyFundedAirline {
        require(
            !flightSuretyData.isAirline(_airlineAddress),
            "Airline already exists."
        );

        bytes memory newAirlineName = bytes(newAirlines[_airlineAddress].name);
        require(
            newAirlineName.length == 0,
            "Airline already added for voting, you can approve it"
        );

        uint256 airlineOwnersCount = flightSuretyData.getAirlineOwnersCount();
        uint256 fundedAirlinesCount = flightSuretyData.getFundedAirlinesCount();

        if (
            airlineOwnersCount < MAX_AIRLINES_WITHOUT_VOTING ||
            fundedAirlinesCount == 1
        ) {
            flightSuretyData.registerAirline(_airlineAddress, _airlineName);
            emit RegisteredAirline(_airlineAddress);
        } else {
            newAirlines[_airlineAddress].name = _airlineName;
            newAirlines[_airlineAddress].votes = 1;
            newAirlines[_airlineAddress].voters[msg.sender] = true;
            emit NewAirlineVoting(_airlineAddress);
        }
    }

    function approveAirlineRegistration(address _airlineAddress)
        external
        operational
        onlyFundedAirline
    {
        bytes memory newAirlineName = bytes(newAirlines[_airlineAddress].name);
        require(
            newAirlineName.length > 0,
            "No registration started for this Airline"
        );

        require(
            !newAirlines[_airlineAddress].voters[msg.sender],
            "Already voted"
        );

        // Vote for aproval of the Airline registration
        newAirlines[_airlineAddress].votes += 1;
        newAirlines[_airlineAddress].voters[msg.sender] = true;
        emit VotedAirlineRegistration(msg.sender, _airlineAddress);

        uint256 fundedAirlinesCount = flightSuretyData.getFundedAirlinesCount();
        uint256 neededVotes = fundedAirlinesCount / 2 + 1;

        // Check if there are enough votes to register the Airline
        if (neededVotes <= newAirlines[_airlineAddress].votes) {
            flightSuretyData.registerAirline(
                _airlineAddress,
                newAirlines[_airlineAddress].name
            );

            delete newAirlines[_airlineAddress];
            emit RegisteredAirline(_airlineAddress);
        }
    }

    function registerFlight(string memory _name, uint256 _timestamp)
        external
        operational
        onlyFundedAirline
    {
        flights.push(
            Flight(msg.sender, _name, _timestamp, STATUS_CODE_UNKNOWN)
        );

        emit RegisteredFlight(msg.sender, _name, _timestamp);
    }

    // After Oracles submitted response
    function processFlightStatus(
        address _airline,
        string memory _flight,
        uint256 _timestamp,
        uint8 _statusCode
    ) internal operational {
        bytes32 key = getFlightKey(_airline, _flight, _timestamp);

        // Modify status code for the flight
        for (uint256 i; i < flights.length; i++) {
            bytes32 flightKey = getFlightKey(
                flights[i].airline,
                flights[i].name,
                flights[i].timestamp
            );

            if (key != flightKey) continue;
            flights[i].statusCode = _statusCode;
        }

        // Credit insurees if it is the case for it
        if (_statusCode == STATUS_CODE_LATE_AIRLINE) {
            flightSuretyData.creditInsurees(key);
        }
    }

    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(
        address _airline,
        string memory _flight,
        uint256 _timestamp
    ) external {
        uint8 index = getRandomIndex();

        bytes32 key = keccak256(
            abi.encodePacked(index, _airline, _flight, _timestamp)
        );

        oracleResponses[key].requester = msg.sender;
        oracleResponses[key].isOpen = true;

        emit OracleRequest(index, _airline, _flight, _timestamp);
    }

    // region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness
    uint256 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    mapping(address => Oracle) private oracles;

    struct ResponseInfo {
        address requester; // Account that requested status
        bool isOpen; // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses; // Mapping key is the status code reported
    }

    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Fired each time there are MIN_RESPONSES for a status
    event FlightStatusInfo(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    // Fired each time an oracle submits a response
    event OracleReport(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    // Fired when flight status is requested
    event OracleRequest(
        uint8 index,
        address airline,
        string flight,
        uint256 timestamp
    );

    function registerOracle() external payable {
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes();

        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});
    }

    function getMyIndexes() external view returns (uint8[3] memory) {
        require(
            oracles[msg.sender].isRegistered,
            "Not registered as an oracle"
        );

        return oracles[msg.sender].indexes;
    }

    function submitOracleResponse(
        uint8 _index,
        address _airline,
        string memory _flight,
        uint256 _timestamp,
        uint8 _statusCode
    ) external {
        require(
            (oracles[msg.sender].indexes[0] == _index) ||
                (oracles[msg.sender].indexes[1] == _index) ||
                (oracles[msg.sender].indexes[2] == _index),
            "Index does not match oracle request"
        );

        bytes32 key = keccak256(
            abi.encodePacked(_index, _airline, _flight, _timestamp)
        );

        // Check if someone used fetchFlightStatus()
        if (oracleResponses[key].isOpen == false) return;

        oracleResponses[key].responses[_statusCode].push(msg.sender);
        emit OracleReport(_airline, _flight, _timestamp, _statusCode);

        // Information isn't considered verified until at least MIN_RESPONSES
        if (
            oracleResponses[key].responses[_statusCode].length >= MIN_RESPONSES
        ) {
            emit FlightStatusInfo(_airline, _flight, _timestamp, _statusCode);

            processFlightStatus(_airline, _flight, _timestamp, _statusCode);

            oracleResponses[key].isOpen = false;
        }
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes() internal returns (uint8[3] memory) {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex();

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex();
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex();
        }

        return indexes;
    }

    function getRandomIndex() internal returns (uint8) {
        uint8 maxValue = 10;
        return uint8(uint256(keccak256(abi.encodePacked(nonce++)))) % maxValue;
    }
}
