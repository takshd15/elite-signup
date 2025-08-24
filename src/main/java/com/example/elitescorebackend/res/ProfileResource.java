package com.example.elitescorebackend.res;

import com.example.elitescorebackend.handlers.ProfileInfoHandler;
import com.example.elitescorebackend.handlers.UserHandler;
import com.example.elitescorebackend.models.ProfileInfo;
import com.example.elitescorebackend.models.User;
import com.example.elitescorebackend.models.enums.ProfileVisibility;
import com.example.elitescorebackend.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.Instant;
import java.util.List;

@Path("/users")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ProfileResource {

    @POST
    @Path("/add_profile")
    public Response add_profile(@Context HttpServletRequest request, UpdateProfileRequest req) {
        int userId = Integer.parseInt((String) request.getAttribute("userId"));
        User requester = UserHandler.getInstance().getUser(userId);

        if (requester == null) {
            ApiResponse<Void> resp = new ApiResponse<>(false, "User does not exist", null);
            return Response.status(Response.Status.UNAUTHORIZED).entity(resp).build();
        }

        ProfileInfo profileInfo = new ProfileInfo();
        profileInfo.setUserId((long) userId);

        if (req.phoneNumber != null) {
            profileInfo.setPhoneNumber(req.phoneNumber);
        }else {
            ApiResponse<Void> resp = new ApiResponse<>(false, "Phone number not added", null);
            return Response.status(Response.Status.NO_CONTENT).entity(resp).build();
        }

        if (req.firstName != null) {
            profileInfo.setFirstName(req.firstName);
        }else {
            ApiResponse<Void> resp = new ApiResponse<>(false, "First Name not added", null);
            return Response.status(Response.Status.NO_CONTENT).entity(resp).build();
        }

        if (req.lastName != null) {
            profileInfo.setLastName(req.lastName);
        }else {
            ApiResponse<Void> resp = new ApiResponse<>(false, "Last Name not added", null);
            return Response.status(Response.Status.NO_CONTENT).entity(resp).build();
        }

        if (req.bio != null) {
            profileInfo.setBio(req.bio);
        }else{
            profileInfo.setBio("No bio added so far");
        }

        profileInfo.setResume("None");
        profileInfo.setGrowthScore(0);
        profileInfo.setXpPoints(0);
        profileInfo.setAchievements(null);
        profileInfo.setActiveChallenge(0);
        profileInfo.setChallengesCompleted(0);
        profileInfo.setVisibility(ProfileVisibility.PUBLIC);
        Instant now = Instant.now();
        profileInfo.setCreatedAt(now);
        profileInfo.setUpdatedAt(now);

        ProfileInfoHandler.getInstance().createProfile(profileInfo);

        ApiResponse<Void> resp = new ApiResponse<>(true, "Profile created successfully", null);
        return Response.status(Response.Status.CREATED).entity(resp).build();
    }

    @PATCH
    @Path("/update_profile")
    public Response update_profile(@Context HttpServletRequest request, UpdateProfileRequest req) {
        int userId = Integer.parseInt((String) request.getAttribute("userId"));
        User requester = UserHandler.getInstance().getUser(userId);

        if (requester == null) {
            ApiResponse<Void> resp = new ApiResponse<>(false, "User does not exist", null);
            return Response.status(Response.Status.UNAUTHORIZED).entity(resp).build();
        }

        ProfileInfo profileInfo = new ProfileInfo();
        profileInfo.setUserId((long) userId);

        // only overwrite fields that were actually provided
        if (req.phoneNumber != null) {
            profileInfo.setPhoneNumber(req.phoneNumber);
        }
        if (req.firstName != null) {
            profileInfo.setFirstName(req.firstName);
        }
        if (req.lastName != null) {
            profileInfo.setLastName(req.lastName);
        }
        if (req.bio != null) {
            profileInfo.setBio(req.bio);
        }
        if (req.resume != null) {
            profileInfo.setResume(req.resume);
        }
        if (req.growthScore != null) {
            profileInfo.setGrowthScore(req.growthScore);
        }
        if (req.xpPoints != null) {
            profileInfo.setXpPoints(req.xpPoints);
        }
        if (req.achievements != null) {
            profileInfo.setAchievements(req.achievements);
        }
        if (req.activeChallenge != null) {
            profileInfo.setActiveChallenge(req.activeChallenge);
        }
        if (req.challengesCompleted != null) {
            profileInfo.setChallengesCompleted(req.challengesCompleted);
        }
        if (req.visibility != null) {
            profileInfo.setVisibility(ProfileVisibility.fromString(req.visibility));
        }

        profileInfo.setUpdatedAt(Instant.now());
        ProfileInfoHandler.getInstance().updateProfile(profileInfo);

        ApiResponse<Void> resp = new ApiResponse<>(true, "Profile updated successfully", null);
        return Response.ok(resp).entity(resp).build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/get_profile/{userId}")
    public Response get_profile(
            @PathParam("userId") int targetUserId
    ) {
        ProfileInfo profileInfo = ProfileInfoHandler.getInstance().getProfile(targetUserId);
        ApiResponse<ProfileInfo> resp = new ApiResponse<>(
                true,
                "Following retrieved",
                profileInfo
        );
        return Response.ok(resp).build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/get_own_profile")
    public Response get_own_profile(@Context HttpServletRequest request) {
        Integer userId = Integer.parseInt((String) request.getAttribute("userId"));
        User requester = UserHandler.getInstance().getUser(userId);

        if (requester == null) {
            ApiResponse<Void> error = new ApiResponse<>(false, "User does not exist", null);
            return Response.status(Response.Status.UNAUTHORIZED).entity(error).build();
        }
        ProfileInfo profileInfo = ProfileInfoHandler.getInstance().getProfile(userId);
        ApiResponse<ProfileInfo> resp = new ApiResponse<>(
                true,
                "Following retrieved",
                profileInfo
        );
        return Response.ok(resp).build();
    }


    static class UpdateProfileRequest {
        public String phoneNumber;
        public String firstName;
        public String lastName;
        public String bio;
        public String resume;
        public Integer growthScore;
        public Integer xpPoints;
        public List<String> achievements;
        public Integer activeChallenge;
        public Integer challengesCompleted;
        public String visibility;
    }
}
