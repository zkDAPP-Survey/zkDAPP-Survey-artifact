// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Groth16Verifier.sol";

/// Survey registry (deployed on Sepolia). Every proof is bound to the survey it is used for:
/// - the requirement public inputs must hash to the survey's eligibilityHash
/// - the issuer key must be the trusted ZkIssuer key
/// - currentDate must be today or yesterday (UTC) according to block.timestamp
/// - the proof must name this election, and its nullifier must be unused
/// The registration token goes to the voter address bound in the proof rather than to msg.sender,
/// so a relayer can submit registrations and voter wallets never need ETH (or a funding trail).
contract ElectionManager is ERC1155, Ownable, Groth16Verifier {
    // Public signal layout of zk/circuits/eligibility.circom (zk/build/v4)
    uint256 constant PUBLIC_INPUT_COUNT = 22;
    uint256 constant IDX_NULLIFIER = 0;
    uint256 constant IDX_PUBKEY_X = 1;
    uint256 constant IDX_PUBKEY_Y = 2;
    uint256 constant IDX_CURRENT_DATE = 3;
    uint256 constant IDX_RULES_START = 4; // minAge .. enableDistrictCheck
    uint256 constant RULES_COUNT = 16;
    uint256 constant IDX_ELECTION_ID = 20;
    uint256 constant IDX_VOTER = 21;

    uint256 public immutable issuerPubKeyX;
    uint256 public immutable issuerPubKeyY;

    enum ElectionStatus {
        Created,
        Started,
        Cancelled
    }

    struct Election {
        uint256 id;
        address creator;
        uint256 tokenId;
        string metadataURI;
        bytes32 metadataHash;
        bytes32 eligibilityHash;
        uint256 maxVoters;
        uint256 startDate;
        uint256 endDate;
        uint256 registeredVoters;
        ElectionStatus status;
        string vocdoniElectionId;
        bytes32 vocdoniSpecHash;
        uint256 createdAt;
        uint256 startedAt;
    }

    uint256 public nextElectionId = 1;

    mapping(uint256 => Election) private elections;
    mapping(address => uint256[]) private creatorElections;
    mapping(address => uint256[]) private voterElections;
    mapping(uint256 => bool) public usedNullifiers;

    event ElectionCreated(
        uint256 indexed electionId,
        address indexed creator,
        uint256 indexed tokenId,
        string metadataURI,
        bytes32 metadataHash,
        bytes32 eligibilityHash,
        uint256 maxVoters,
        uint256 startDate,
        uint256 endDate
    );

    event VoterRegistered(
        uint256 indexed electionId,
        address indexed voter,
        uint256 indexed tokenId
    );

    event ElectionStarted(
        uint256 indexed electionId,
        string vocdoniElectionId,
        bytes32 vocdoniSpecHash
    );

    event ElectionCancelled(uint256 indexed electionId);

    constructor(
        string memory uri_,
        uint256 issuerPubKeyX_,
        uint256 issuerPubKeyY_
    ) ERC1155(uri_) Ownable(msg.sender) {
        issuerPubKeyX = issuerPubKeyX_;
        issuerPubKeyY = issuerPubKeyY_;
    }

    modifier electionExists(uint256 electionId) {
        require(elections[electionId].id != 0, "Election does not exist");
        _;
    }

    modifier onlyCreator(uint256 electionId) {
        require(elections[electionId].creator == msg.sender, "Not creator");
        _;
    }

    /// @param eligibilityHash keccak256 of the 16 requirement public inputs (minAge .. enableDistrictCheck),
    ///        each encoded as a 32-byte word, as derived from the survey's requirements.
    function createElection(
        string calldata metadataURI,
        bytes32 metadataHash,
        bytes32 eligibilityHash,
        uint256 maxVoters,
        uint256 startDate,
        uint256 endDate
    ) external returns (uint256 electionId) {
        require(bytes(metadataURI).length > 0, "Missing metadata URI");
        require(metadataHash != bytes32(0), "Missing metadata hash");
        require(eligibilityHash != bytes32(0), "Missing eligibility hash");
        require(endDate == 0 || endDate > startDate, "Invalid dates");

        electionId = nextElectionId++;
        uint256 tokenId = electionId;

        elections[electionId] = Election({
            id: electionId,
            creator: msg.sender,
            tokenId: tokenId,
            metadataURI: metadataURI,
            metadataHash: metadataHash,
            eligibilityHash: eligibilityHash,
            maxVoters: maxVoters,
            startDate: startDate,
            endDate: endDate,
            registeredVoters: 0,
            status: ElectionStatus.Created,
            vocdoniElectionId: "",
            vocdoniSpecHash: bytes32(0),
            createdAt: block.timestamp,
            startedAt: 0
        });

        creatorElections[msg.sender].push(electionId);

        emit ElectionCreated(
            electionId,
            msg.sender,
            tokenId,
            metadataURI,
            metadataHash,
            eligibilityHash,
            maxVoters,
            startDate,
            endDate
        );
    }

    function registerForElection(
        uint256 electionId,
        uint256[2] calldata pi_a,
        uint256[2][2] calldata pi_b,
        uint256[2] calldata pi_c,
        uint256[PUBLIC_INPUT_COUNT] calldata pubInputs
    ) external electionExists(electionId) {
        // Anyone may submit: the proof itself names the voter, so front-running only registers that same voter
        require(pubInputs[IDX_VOTER] != 0 && pubInputs[IDX_VOTER] >> 160 == 0, "Invalid voter address");
        address voter = address(uint160(pubInputs[IDX_VOTER]));

        string memory error = _registrationError(electionId, voter, pubInputs);
        require(bytes(error).length == 0, error);
        // External self-call on purpose: the snarkjs verifier ends with an assembly `return`,
        // which would end this whole call if verifyProof were called internally.
        require(this.verifyProof(pi_a, pi_b, pi_c, pubInputs), "Invalid ZK proof");

        Election storage e = elections[electionId];
        usedNullifiers[pubInputs[IDX_NULLIFIER]] = true;
        e.registeredVoters += 1;
        voterElections[voter].push(electionId);

        _mint(voter, e.tokenId, 1, "");

        emit VoterRegistered(electionId, voter, e.tokenId);
    }

    /// Runs every registration check without sending a transaction.
    /// Returns an empty string when `voter` could register with this proof, otherwise the reason it would revert.
    function checkRegistration(
        uint256 electionId,
        address voter,
        uint256[2] calldata pi_a,
        uint256[2][2] calldata pi_b,
        uint256[2] calldata pi_c,
        uint256[PUBLIC_INPUT_COUNT] calldata pubInputs
    ) external view electionExists(electionId) returns (string memory) {
        string memory error = _registrationError(electionId, voter, pubInputs);
        if (bytes(error).length != 0) return error;
        if (!this.verifyProof(pi_a, pi_b, pi_c, pubInputs)) return "Invalid ZK proof";
        return "";
    }

    function startElection(
        uint256 electionId,
        string calldata vocdoniElectionId,
        bytes32 vocdoniSpecHash
    ) external electionExists(electionId) onlyCreator(electionId) {
        Election storage e = elections[electionId];

        require(e.status == ElectionStatus.Created, "Invalid status");
        require(bytes(vocdoniElectionId).length > 0, "Missing Vocdoni ID");
        require(vocdoniSpecHash != bytes32(0), "Missing Vocdoni spec hash");

        bool maxReached = e.maxVoters > 0 && e.registeredVoters >= e.maxVoters;
        bool startReached = e.startDate == 0 || block.timestamp >= e.startDate;

        require(maxReached || startReached, "Cannot start yet");

        e.status = ElectionStatus.Started;
        e.vocdoniElectionId = vocdoniElectionId;
        e.vocdoniSpecHash = vocdoniSpecHash;
        e.startedAt = block.timestamp;

        emit ElectionStarted(electionId, vocdoniElectionId, vocdoniSpecHash);
    }

    function cancelElection(
        uint256 electionId
    ) external electionExists(electionId) onlyCreator(electionId) {
        Election storage e = elections[electionId];
        require(e.status == ElectionStatus.Created, "Cannot cancel");

        e.status = ElectionStatus.Cancelled;

        emit ElectionCancelled(electionId);
    }

    function getElection(
        uint256 electionId
    ) external view electionExists(electionId) returns (Election memory) {
        return elections[electionId];
    }

    function getCreatorElections(
        address creator
    ) external view returns (uint256[] memory) {
        return creatorElections[creator];
    }

    function getVoterElections(
        address voter
    ) external view returns (uint256[] memory) {
        return voterElections[voter];
    }

    function isRegistered(
        uint256 electionId,
        address voter
    ) external view electionExists(electionId) returns (bool) {
        return balanceOf(voter, elections[electionId].tokenId) > 0;
    }

    /// Checks only the Groth16 proof itself, not whether it fits a survey (see checkRegistration).
    function verifyProofView(
        uint256[2] calldata pi_a,
        uint256[2][2] calldata pi_b,
        uint256[2] calldata pi_c,
        uint256[PUBLIC_INPUT_COUNT] calldata pubInputs
    ) external view returns (bool) {
        return this.verifyProof(pi_a, pi_b, pi_c, pubInputs);
    }

    function _registrationError(
        uint256 electionId,
        address voter,
        uint256[PUBLIC_INPUT_COUNT] calldata pubInputs
    ) internal view returns (string memory) {
        Election storage e = elections[electionId];

        if (e.status != ElectionStatus.Created) return "Election not open";
        if (balanceOf(voter, e.tokenId) != 0) return "Already registered";
        if (e.maxVoters > 0 && e.registeredVoters >= e.maxVoters) return "Max voters reached";

        if (pubInputs[IDX_ELECTION_ID] != electionId) return "Proof is for another election";
        if (pubInputs[IDX_VOTER] != uint256(uint160(voter))) return "Proof is for another wallet";
        if (pubInputs[IDX_PUBKEY_X] != issuerPubKeyX || pubInputs[IDX_PUBKEY_Y] != issuerPubKeyY) {
            return "Credential not signed by the trusted issuer";
        }
        if (!_isCurrentDate(pubInputs[IDX_CURRENT_DATE])) return "Proof date is not today";
        if (_rulesHash(pubInputs) != e.eligibilityHash) return "Proof does not match survey requirements";
        if (usedNullifiers[pubInputs[IDX_NULLIFIER]]) return "Credential already used for this election";

        return "";
    }

    function _rulesHash(uint256[PUBLIC_INPUT_COUNT] calldata pubInputs) internal pure returns (bytes32) {
        uint256[RULES_COUNT] memory rules;
        for (uint256 i = 0; i < RULES_COUNT; i++) {
            rules[i] = pubInputs[IDX_RULES_START + i];
        }
        return keccak256(abi.encodePacked(rules));
    }

    /// Accepts today's or yesterday's UTC date, so a proof made just before midnight still registers.
    function _isCurrentDate(uint256 yyyymmdd) internal view returns (bool) {
        uint256 today = block.timestamp / 1 days;
        return yyyymmdd == _toYyyymmdd(today) || yyyymmdd == _toYyyymmdd(today - 1);
    }

    /// Days since 1970-01-01 to a yyyymmdd number (civil_from_days, H. Hinnant).
    function _toYyyymmdd(uint256 daysSinceEpoch) internal pure returns (uint256) {
        uint256 z = daysSinceEpoch + 719468;
        uint256 era = z / 146097;
        uint256 doe = z - era * 146097;
        uint256 yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
        uint256 doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
        uint256 mp = (5 * doy + 2) / 153;
        uint256 day = doy - (153 * mp + 2) / 5 + 1;
        uint256 month = mp < 10 ? mp + 3 : mp - 9;
        uint256 year = yoe + era * 400 + (month <= 2 ? 1 : 0);
        return year * 10000 + month * 100 + day;
    }

    function safeTransferFrom(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public pure override {
        revert("Election tokens are non-transferable");
    }

    function safeBatchTransferFrom(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public pure override {
        revert("Election tokens are non-transferable");
    }
}
