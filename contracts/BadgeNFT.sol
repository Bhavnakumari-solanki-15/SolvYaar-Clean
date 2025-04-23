// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract BadgeNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Badge {
        uint256 id;
        string category;
        uint256 level;
        uint256 timestamp;
    }

    // Mapping from token ID to Badge
    mapping(uint256 => Badge) private _badges;
    
    // Mapping from user address to their badge IDs
    mapping(address => uint256[]) private _userBadges;

    event BadgeMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string category,
        uint256 level,
        uint256 timestamp
    );

    constructor() ERC721("MathWizard Badge", "MWB") Ownable() {}

    function mintBadge(
        address to,
        string memory category,
        uint256 level,
        string memory uri
    ) external onlyOwner returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        Badge memory badge = Badge({
            id: newTokenId,
            category: category,
            level: level,
            timestamp: block.timestamp
        });

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, uri);
        
        _badges[newTokenId] = badge;
        _userBadges[to].push(newTokenId);

        emit BadgeMinted(
            newTokenId,
            to,
            category,
            level,
            block.timestamp
        );

        return newTokenId;
    }

    function getUserBadges(address user) external view returns (Badge[] memory) {
        uint256[] storage badgeIds = _userBadges[user];
        Badge[] memory badges = new Badge[](badgeIds.length);

        for (uint256 i = 0; i < badgeIds.length; i++) {
            badges[i] = _badges[badgeIds[i]];
        }

        return badges;
    }

    function getBadge(uint256 tokenId) external view returns (Badge memory) {
        return _badges[tokenId];
    }
} 