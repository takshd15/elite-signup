package com.example.elitescorebackend.models;

import com.example.elitescorebackend.models.enums.ProfileVisibility;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;


import java.time.Instant;
import java.util.List;

public class ProfileInfo {

    private Long userId;
    private String phoneNumber;
    private String firstName;
    private String lastName;
    private String bio;
    private String resume;
    private Integer growthScore;
    private Integer xpPoints;
    private List<String> achievements;
    private Integer activeChallenge;
    private Integer challengesCompleted;
    private Integer followersCount;
    private Integer followingCount;
    private ProfileVisibility visibility;
    private Instant createdAt;
    private Instant updatedAt;

    public ProfileInfo() {
        // default constructor
    }

    public String toJson() {
       ObjectMapper MAPPER = new ObjectMapper().registerModule(new JavaTimeModule())
               // write dates as ISO-8601 strings, not timestamps
               .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);;
        try {
            return MAPPER.writeValueAsString(this);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize ProfileInfo to JSON", e);
        }
    }

    // --- Getters & Setters ---

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getResume() {
        return resume;
    }

    public void setResume(String resume) {
        this.resume = resume;
    }

    public Integer getGrowthScore() {
        return growthScore;
    }

    public void setGrowthScore(Integer growthScore) {
        this.growthScore = growthScore;
    }

    public Integer getXpPoints() {
        return xpPoints;
    }

    public void setXpPoints(Integer xpPoints) {
        this.xpPoints = xpPoints;
    }

    public List<String> getAchievements() {
        return achievements;
    }

    public void setAchievements(List<String> achievements) {
        this.achievements = achievements;
    }

    public Integer getActiveChallenge() {
        return activeChallenge;
    }

    public void setActiveChallenge(Integer activeChallenge) {
        this.activeChallenge = activeChallenge;
    }

    public Integer getChallengesCompleted() {
        return challengesCompleted;
    }

    public void setChallengesCompleted(Integer challengesCompleted) {
        this.challengesCompleted = challengesCompleted;
    }

    public Integer getFollowersCount() {
        return followersCount;
    }

    public void setFollowersCount(Integer followersCount) {
        this.followersCount = followersCount;
    }

    public Integer getFollowingCount() {
        return followingCount;
    }

    public void setFollowingCount(Integer followingCount) {
        this.followingCount = followingCount;
    }

    public ProfileVisibility getVisibility() {
        return visibility;
    }

    public void setVisibility(ProfileVisibility visibility) {
        this.visibility = visibility;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public String toString() {
        return "ProfileInfo{" +
                "userId=" + userId +
                ", phoneNumber='" + phoneNumber + '\'' +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", bio='" + bio + '\'' +
                ", resume='" + resume + '\'' +
                ", growthScore=" + growthScore +
                ", xpPoints=" + xpPoints +
                ", achievements=" + achievements +
                ", activeChallenge=" + activeChallenge +
                ", challengesCompleted=" + challengesCompleted +
                ", followersCount=" + followersCount +
                ", followingCount=" + followingCount +
                ", visibility=" + visibility +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
