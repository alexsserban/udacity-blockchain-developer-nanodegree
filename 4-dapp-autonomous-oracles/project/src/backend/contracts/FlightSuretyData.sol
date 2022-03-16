// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../node_modules/openzeppelin-solidity/contracts/utils/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;
    address private appContractOwner;

    bool private isOperational = true;

    uint256 private constant MIN_FUNDING = 10000000000000000000;
    uint256 private constant MAX_INSURANCE = 1000000000000000000;

    struct Airline {
        string name;
        bool isFunded;
        uint256 funds;
        uint256 listPointer;
    }

    mapping(address => Airline) public airlines;
    address[] public airlineOwners;
    uint256 public fundedAirlinesCount;

    struct Insuree {
        address owner;
        uint256 value;
        bool isWithdrawable;
    }

    mapping(bytes32 => Insuree[]) private insurees;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event ChangedOperatingStatus(bool isOperational);
    event BoughtInsurance(address insuree);
    event PaidInsuree(address insuree);
    event FundedAirline(address airlineAddress);

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    constructor(address _airlineAddress, string memory _airlineName) {
        contractOwner = msg.sender;

        // Add first airline
        airlineOwners.push(_airlineAddress);
        airlines[_airlineAddress] = Airline(_airlineName, false, 0, 0);
    }

    receive() external payable {
        fund();
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    modifier operational() {
        require(isOperational, "Contract is currently not operational");
        _;
    }

    modifier onlyContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier onlyAuthorizedApp() {
        require(appContractOwner == msg.sender, "Caller is not authorized");
        _;
    }

    modifier onlyAirline() {
        require(isAirline(msg.sender), "Caller is not an Airline");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function authorizeCaller(address _contractAddress)
        external
        onlyContractOwner
    {
        appContractOwner = _contractAddress;
    }

    function deauthorizeCaller() external onlyContractOwner {
        appContractOwner = address(0);
    }

    function getIsOperational() external view returns (bool) {
        return isOperational;
    }

    function setIsOperational(bool _mode) external onlyContractOwner {
        isOperational = _mode;
        emit ChangedOperatingStatus(isOperational);
    }

    function isAirline(address _airlineAddress) public view returns (bool) {
        if (airlineOwners.length == 0) return false;

        return (airlineOwners[airlines[_airlineAddress].listPointer] ==
            _airlineAddress);
    }

    function isFundedAirline(address _airlineAddress)
        public
        view
        returns (bool)
    {
        require(isAirline(_airlineAddress), "Not Airline");
        return airlines[_airlineAddress].isFunded;
    }

    function getAirlineOwnersCount() public view returns (uint256) {
        return airlineOwners.length;
    }

    function getFundedAirlinesCount() public view returns (uint256) {
        return fundedAirlinesCount;
    }

    function getFlightKey(
        address _airline,
        string memory _flight,
        uint256 _timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_airline, _flight, _timestamp));
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function registerAirline(
        address _airlineAddress,
        string memory _airlineName
    ) external onlyAuthorizedApp operational {
        airlineOwners.push(_airlineAddress);
        airlines[_airlineAddress] = Airline(
            _airlineName,
            false,
            0,
            airlineOwners.length - 1
        );
    }

    function buyInsurance(
        address _airline,
        string memory _flight,
        uint256 _timestamp
    ) external payable operational {
        require(msg.value > 0, "Nothing to add to insurance");

        bytes32 flightKey = getFlightKey(_airline, _flight, _timestamp);

        for (uint256 i = 0; i < insurees[flightKey].length; i++) {
            require(
                insurees[flightKey][i].owner != msg.sender,
                "Already insured"
            );
        }

        uint256 value;
        uint256 valueToReturn;

        // Check if more than 1 ETH was send for insurance
        if (msg.value > MAX_INSURANCE) {
            value = MAX_INSURANCE;
            valueToReturn = msg.value - value;
        } else {
            value = msg.value;
        }

        // Add insurance
        insurees[flightKey].push(Insuree(msg.sender, value, false));

        // Return back if more than 1 ETH was send initially
        if (valueToReturn > 0) {
            payable(msg.sender).transfer(valueToReturn);
        }

        emit BoughtInsurance(msg.sender);
    }

    function creditInsurees(bytes32 _flightKey)
        external
        operational
        onlyAuthorizedApp
    {
        for (uint256 i = 0; i < insurees[_flightKey].length; i++) {
            insurees[_flightKey][i].isWithdrawable = true;
        }
    }

    function payoutInsurance(
        address _airline,
        string memory _flight,
        uint256 _timestamp
    ) external operational {
        bytes32 flightKey = getFlightKey(_airline, _flight, _timestamp);

        // Check if the flight was delayed due to Airline fault
        if (insurees[flightKey][0].isWithdrawable == false) return;

        for (uint256 i = 0; i < insurees[flightKey].length; i++) {
            if (insurees[flightKey][i].owner == msg.sender) {
                // Value of the insurance
                uint256 value = insurees[flightKey][i].value;

                // Delete the insurance
                delete insurees[flightKey][i];

                // Transfer funds to insurees with an 1.5 multiplier
                payable(msg.sender).transfer((value * 3) / 2);

                emit PaidInsuree(msg.sender);
                break;
            }
        }
    }

    function fund() public payable operational onlyAirline {
        require(msg.value > 0, "No funds added");

        airlines[msg.sender].funds += msg.value;
        if (airlines[msg.sender].funds >= MIN_FUNDING) {
            airlines[msg.sender].isFunded = true;
            fundedAirlinesCount += 1;

            emit FundedAirline(msg.sender);
        }
    }
}
