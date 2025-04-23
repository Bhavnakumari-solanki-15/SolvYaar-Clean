// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract PracticeAchievements is Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _achievementIds;

    struct Achievement {
        uint256 id;
        address user;
        string topic;
        uint256 score;
        uint256 timestamp;
    }

    // Mapping from achievement ID to Achievement
    mapping(uint256 => Achievement) private _achievements;
    
    // Mapping from user address to their achievement IDs
    mapping(address => uint256[]) private _userAchievements;

    event AchievementRecorded(
        uint256 indexed id,
        address indexed user,
        string topic,
        uint256 score,
        uint256 timestamp
    );

    constructor() Ownable() {}

    function recordAchievement(
        string memory topic,
        uint256 score
    ) external returns (uint256) {
        _achievementIds.increment();
        uint256 newAchievementId = _achievementIds.current();

        Achievement memory achievement = Achievement({
            id: newAchievementId,
            user: msg.sender,
            topic: topic,
            score: score,
            timestamp: block.timestamp
        });

        _achievements[newAchievementId] = achievement;
        _userAchievements[msg.sender].push(newAchievementId);

        emit AchievementRecorded(
            newAchievementId,
            msg.sender,
            topic,
            score,
            block.timestamp
        );

        return newAchievementId;
    }

    function getUserAchievements(address user) external view returns (Achievement[] memory) {
        uint256[] storage achievementIds = _userAchievements[user];
        Achievement[] memory achievements = new Achievement[](achievementIds.length);

        for (uint256 i = 0; i < achievementIds.length; i++) {
            achievements[i] = _achievements[achievementIds[i]];
        }

        return achievements;
    }

    function getAchievement(uint256 achievementId) external view returns (Achievement memory) {
        return _achievements[achievementId];
    }
} 