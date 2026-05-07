// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

/// @title LootScratch — on-chain scratch cards with Chainlink VRF v2.5
contract LootScratch is ERC721Enumerable, VRFConsumerBaseV2Plus {
    using Strings for uint256;

    uint8 public constant RARITY_COMMON = 0;
    uint8 public constant RARITY_RARE = 1;
    uint8 public constant RARITY_EPIC = 2;
    uint8 public constant RARITY_LEGENDARY = 3;

    uint256 public constant SECONDS_PER_DAY = 86400;
    uint256 public constant DAILY_LIMIT = 5;
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant REFERRAL_BPS = 500;

    uint256 public mintFee = 0.001 ether;
    uint256 public totalScratches;
    uint256 public totalPlayers;

    bytes32 public immutable i_keyHash;
    uint256 public immutable i_subscriptionId;
    uint32 public immutable i_callbackGasLimit = 800_000;
    uint16 public immutable i_requestConfirmations = 3;

    bool public paused;

    mapping(address => bool) private _knownPlayer;
    mapping(address => uint256) private _lastScratchDay;
    mapping(address => uint256) private _streakDays;
    mapping(address => bool) public legendaryBoostPending;
    mapping(address => uint256) private _scratchesToday;
    mapping(address => uint256) private _scratchDayBucket;
    mapping(address => uint256) public legendaryMinted;
    mapping(uint256 => uint8) private _tokenRarity;
    mapping(uint256 => Pending) private _pending;
    mapping(address => bool) private _pendingRequest;

    struct Pending {
        address player;
        address referrer;
        bool useLegendaryBoost;
    }

    event Scratched(address indexed player, uint256 indexed tokenId, uint8 rarity);
    event StreakAchieved(address indexed player, uint256 streakDays);
    event LegendaryMinted(address indexed player, uint256 indexed tokenId);
    event ScratchRequested(address indexed player, uint256 requestId);
    event MintFeeUpdated(uint256 newFee);
    event Withdrawal(address indexed to, uint256 amount);

    error LootScratch__Paused();
    error LootScratch__WrongPayment();
    error LootScratch__DailyLimit();
    error LootScratch__PendingRequest();
    error LootScratch__ReferralFailed();

    constructor(
        address vrfCoordinator,
        bytes32 keyHash,
        uint256 subscriptionId
    ) ERC721("Loot Scratch", "LOOT") VRFConsumerBaseV2Plus(vrfCoordinator) {
        i_keyHash = keyHash;
        i_subscriptionId = subscriptionId;
    }

    modifier whenNotPaused() {
        if (paused) revert LootScratch__Paused();
        _;
    }

    function scratch(address referrer) external payable whenNotPaused {
        if (_pendingRequest[msg.sender]) revert LootScratch__PendingRequest();
        if (msg.value != mintFee) revert LootScratch__WrongPayment();

        uint256 day = block.timestamp / SECONDS_PER_DAY;
        if (_scratchDayBucket[msg.sender] != day) {
            _scratchDayBucket[msg.sender] = day;
            _scratchesToday[msg.sender] = 0;
        }
        if (_scratchesToday[msg.sender] >= DAILY_LIMIT) revert LootScratch__DailyLimit();

        if (referrer != address(0) && referrer != msg.sender) {
            uint256 refAmt = (mintFee * REFERRAL_BPS) / BPS_DENOMINATOR;
            (bool ok, ) = payable(referrer).call{value: refAmt}("");
            if (!ok) revert LootScratch__ReferralFailed();
        }

        _scratchesToday[msg.sender]++;
        totalScratches++;
        if (!_knownPlayer[msg.sender]) {
            _knownPlayer[msg.sender] = true;
            totalPlayers++;
        }

        bool boost = legendaryBoostPending[msg.sender];
        if (boost) {
            legendaryBoostPending[msg.sender] = false;
        }

        VRFV2PlusClient.ExtraArgsV1 memory extra = VRFV2PlusClient.ExtraArgsV1({nativePayment: true});
        VRFV2PlusClient.RandomWordsRequest memory req = VRFV2PlusClient.RandomWordsRequest({
            keyHash: i_keyHash,
            subId: i_subscriptionId,
            requestConfirmations: i_requestConfirmations,
            callbackGasLimit: i_callbackGasLimit,
            numWords: 1,
            extraArgs: VRFV2PlusClient._argsToBytes(extra)
        });

        uint256 requestId = s_vrfCoordinator.requestRandomWords(req);
        _pendingRequest[msg.sender] = true;
        _pending[requestId] = Pending({player: msg.sender, referrer: referrer, useLegendaryBoost: boost});

        emit ScratchRequested(msg.sender, requestId);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        Pending memory p = _pending[requestId];
        delete _pending[requestId];
        if (p.player == address(0)) return;

        _pendingRequest[p.player] = false;

        uint256 roll = randomWords[0] % 100;
        uint8 rarity = _pickRarity(roll, p.useLegendaryBoost);

        _updateStreak(p.player);

        uint256 tokenId = totalSupply() + 1;
        _tokenRarity[tokenId] = rarity;
        _mint(p.player, tokenId);

        if (rarity == RARITY_LEGENDARY) {
            legendaryMinted[p.player]++;
            emit LegendaryMinted(p.player, tokenId);
        }

        emit Scratched(p.player, tokenId, rarity);
    }

    function _updateStreak(address player) internal {
        uint256 today = block.timestamp / SECONDS_PER_DAY;
        uint256 last = _lastScratchDay[player];

        if (last == today) {
            return;
        }

        uint256 prevStreak = _streakDays[player];

        if (last == 0) {
            _streakDays[player] = 1;
        } else if (last == today - 1) {
            _streakDays[player] += 1;
        } else {
            _streakDays[player] = 1;
        }
        _lastScratchDay[player] = today;

        if (_streakDays[player] == 3 && prevStreak != 3) {
            legendaryBoostPending[player] = true;
            emit StreakAchieved(player, _streakDays[player]);
        }
    }

    function _pickRarity(uint256 roll, bool boost) internal pure returns (uint8) {
        // Boost: Legendary 6%, Epic 12%, Rare 25%, Common 57%
        if (boost) {
            if (roll < 6) return RARITY_LEGENDARY;
            if (roll < 18) return RARITY_EPIC;
            if (roll < 43) return RARITY_RARE;
            return RARITY_COMMON;
        }
        // Normal: Legendary 3%, Epic 12%, Rare 25%, Common 60%
        if (roll < 3) return RARITY_LEGENDARY;
        if (roll < 15) return RARITY_EPIC;
        if (roll < 40) return RARITY_RARE;
        return RARITY_COMMON;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        uint8 rarity = _tokenRarity[tokenId];
        address minter = ownerOf(tokenId);

        string memory namePart = string.concat("Loot Scratch #", tokenId.toString(), " - ", _rarityLabel(rarity));
        string memory descPart = string.concat(
            "A provably fair on-chain scratch card. Rarity: ",
            _rarityLabel(rarity),
            ". Minted by ",
            _toAsciiString(minter),
            ". Powered by Chainlink VRF."
        );

        string memory svg = _svgForRarity(rarity, tokenId);
        string memory json = string.concat(
            '{"name":"',
            namePart,
            '","description":"',
            descPart,
            '","image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(svg)),
            '"}'
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function tokenRarity(uint256 tokenId) external view returns (uint8) {
        _requireOwned(tokenId);
        return _tokenRarity[tokenId];
    }

    function scratchesToday(address player) external view returns (uint256) {
        uint256 day = block.timestamp / SECONDS_PER_DAY;
        if (_scratchDayBucket[player] != day) return 0;
        return _scratchesToday[player];
    }

    function streakDays(address player) external view returns (uint256) {
        return _streakDays[player];
    }

    function setMintFee(uint256 newFee) external onlyOwner {
        mintFee = newFee;
        emit MintFeeUpdated(newFee);
    }

    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }

    function withdraw(address payable to) external onlyOwner {
        uint256 bal = address(this).balance;
        (bool ok, ) = to.call{value: bal}("");
        require(ok, "withdraw failed");
        emit Withdrawal(to, bal);
    }

    function _rarityLabel(uint8 r) internal pure returns (string memory) {
        if (r == RARITY_LEGENDARY) return "LEGENDARY";
        if (r == RARITY_EPIC) return "EPIC";
        if (r == RARITY_RARE) return "RARE";
        return "COMMON";
    }

    function _toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(42);
        s[0] = "0";
        s[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint256(uint160(x)) / (2 ** (8 * (19 - i)))));
            uint8 hi = uint8(b) / 16;
            uint8 lo = uint8(b) % 16;
            s[2 + i * 2] = _hexChar(hi);
            s[3 + i * 2] = _hexChar(lo);
        }
        return string(s);
    }

    function _hexChar(uint8 v) internal pure returns (bytes1) {
        if (v < 10) return bytes1(v + 0x30);
        return bytes1(v + 0x57);
    }

    function _svgForRarity(uint8 rarity, uint256 tokenId) internal pure returns (string memory) {
        if (rarity == RARITY_LEGENDARY) return _svgLegendary(tokenId);
        if (rarity == RARITY_EPIC) return _svgEpic(tokenId);
        if (rarity == RARITY_RARE) return _svgRare(tokenId);
        return _svgCommon(tokenId);
    }

    function _svgCommon(uint256 tokenId) internal pure returns (string memory) {
        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
            '<defs><pattern id="cg" width="20" height="20" patternUnits="userSpaceOnUse">',
            '<path d="M0 0h20v20H0z" fill="none" stroke="#000" stroke-width="1"/></pattern></defs>',
            '<rect width="400" height="400" fill="#ffffff"/>',
            '<rect width="400" height="400" fill="url(#cg)" opacity="0.12"/>',
            '<rect x="120" y="170" width="160" height="60" fill="#9e9e9e" stroke="#000" stroke-width="2"/>',
            '<text x="200" y="210" text-anchor="middle" font-family="monospace" font-size="22" fill="#000">COMMON</text>',
            '<text x="200" y="360" text-anchor="middle" font-family="monospace" font-size="14" fill="#000">#',
            tokenId.toString(),
            "</text></svg>"
        );
    }

    function _svgRare(uint256 /* tokenId */) internal pure returns (string memory) {
        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
            '<defs><pattern id="s" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">',
            '<rect width="10" height="20" fill="#000"/></pattern></defs>',
            '<rect width="400" height="400" fill="#ffdb33"/>',
            '<rect width="400" height="400" fill="url(#s)" opacity="0.15"/>',
            '<rect x="40" y="40" width="320" height="320" fill="none" stroke="#0066cc" stroke-width="6"/>',
            '<text x="200" y="210" text-anchor="middle" font-family="monospace" font-size="26" fill="#000">RARE</text>',
            "</svg>"
        );
    }

    function _svgEpic(uint256 /* tokenId */) internal pure returns (string memory) {
        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
            '<rect width="400" height="400" fill="#321b1bff"/>',
            '<line x1="200" y1="200" x2="200" y2="40" stroke="#fff" stroke-width="2"/><line x1="200" y1="200" x2="360" y2="200" stroke="#fff" stroke-width="2"/>',
            '<line x1="200" y1="200" x2="200" y2="360" stroke="#fff" stroke-width="2"/><line x1="200" y1="200" x2="40" y2="200" stroke="#fff" stroke-width="2"/>',
            '<line x1="200" y1="200" x2="320" y2="80" stroke="#fff" stroke-width="2"/><line x1="200" y1="200" x2="320" y2="320" stroke="#fff" stroke-width="2"/>',
            '<line x1="200" y1="200" x2="80" y2="320" stroke="#fff" stroke-width="2"/><line x1="200" y1="200" x2="80" y2="80" stroke="#fff" stroke-width="2"/>',
            '<circle cx="200" cy="200" r="70" fill="none" stroke="#9c27b0" stroke-width="5"/>',
            '<text x="200" y="210" text-anchor="middle" font-family="monospace" font-size="28" fill="#fff">EPIC</text>',
            "</svg>"
        );
    }

    function _svgLegendary(uint256 tokenId) internal pure returns (string memory) {
        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
            '<defs><pattern id="p" width="8" height="8" patternUnits="userSpaceOnUse">',
            '<rect width="4" height="4" fill="#333"/><rect x="4" y="4" width="4" height="4" fill="#333"/></pattern></defs>',
            '<rect width="400" height="400" fill="#000"/>',
            '<rect x="20" y="20" width="360" height="360" fill="none" stroke="#ffd700" stroke-width="8"/>',
            '<rect x="40" y="40" width="320" height="320" fill="url(#p)" opacity="0.4"/>',
            '<text x="200" y="190" text-anchor="middle" font-family="monospace" font-size="24" fill="#e63946">LEGENDARY</text>',
            '<text x="200" y="230" text-anchor="middle" font-family="monospace" font-size="16" fill="#ffd700">#',
            tokenId.toString(),
            "</text></svg>"
        );
    }

}
