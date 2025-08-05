package com.example.elitescorebackend.res;

import com.example.elitescorebackend.handlers.FollowHandler;
import com.example.elitescorebackend.handlers.UserHandler;
import com.example.elitescorebackend.models.User;
import com.example.elitescorebackend.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.ArrayList;
import java.util.List;

@Path("/users")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class FollowResource {
    @POST
    @Path("/follow")
    public Response follow(@Context HttpServletRequest request, FollowUnfolllowRequest req) {
        Integer userId = Integer.parseInt((String) request.getAttribute("userId"));
        User requester = UserHandler.getInstance().getUser(userId);
        User receiver  = UserHandler.getInstance().getUser(req.userId);

        if (requester == null || receiver == null) {
            ApiResponse<Void> resp = new ApiResponse<>(false, "User does not exist", null);
            return Response.status(Response.Status.UNAUTHORIZED).entity(resp).build();
        }

        boolean created = FollowHandler.getInstance().follow(userId, req.userId);
        if (created) {
            ApiResponse<Void> resp = new ApiResponse<>(true, "Followed successfully", null);
            return Response.ok(resp).build();
        } else {
            ApiResponse<Void> resp = new ApiResponse<>(false, "Already following this user", null);
            return Response.status(Response.Status.BAD_REQUEST).entity(resp).build();
        }
    }

    @POST
    @Path("/unfollow")
    public Response unfollow(@Context HttpServletRequest request, FollowUnfolllowRequest req) {
        Integer userId = Integer.parseInt((String) request.getAttribute("userId"));
        User requester = UserHandler.getInstance().getUser(userId);
        User receiver  = UserHandler.getInstance().getUser(req.userId);

        if (requester == null || receiver == null) {
            ApiResponse<Void> resp = new ApiResponse<>(false, "User does not exist", null);
            return Response.status(Response.Status.UNAUTHORIZED).entity(resp).build();
        }

        boolean removed = FollowHandler.getInstance().unfollow(userId, req.userId);
        if (removed) {
            ApiResponse<Void> resp = new ApiResponse<>(true, "Unfollowed successfully", null);
            return Response.ok(resp).build();
        } else {
            ApiResponse<Void> resp = new ApiResponse<>(false, "You are not following this user", null);
            return Response.status(Response.Status.BAD_REQUEST).entity(resp).build();
        }
    }

    @GET
    @Path("/getFollowers/{userId}")
    public Response getFollowers(
            @PathParam("userId") int targetUserId
    ) {
        List<User> followers = FollowHandler.getInstance().getFollowers(targetUserId);
        ApiResponse<List<User>> resp = new ApiResponse<>(
                true,
                "Followers retrieved",
                followers
        );
        return Response.ok(resp).build();
    }

    @GET
    @Path("/getFollowing/{userId}")
    public Response getFollowing(
            @PathParam("userId") int targetUserId
    ) {
        List<Integer> followers = new ArrayList<>();
        for(User u:FollowHandler.getInstance().getFollowers(targetUserId)){
            followers.add(u.getID());
        }

        ApiResponse<List<Integer>> resp = new ApiResponse<>(
                true,
                "Your followers retrieved",
                followers
        );
        return Response.ok(resp).build();
    }

    @GET
    @Path("/get_own_followers")
    public Response getOwnFollowers(@Context HttpServletRequest request) {
        Integer userId = Integer.parseInt((String) request.getAttribute("userId"));
        User requester = UserHandler.getInstance().getUser(userId);
        if (requester == null) {
            ApiResponse<Void> error = new ApiResponse<>(false, "User does not exist", null);
            return Response.status(Response.Status.UNAUTHORIZED).entity(error).build();
        }
        List<Integer> followers = new ArrayList<>();
        for(User u:FollowHandler.getInstance().getFollowers(userId)){
            followers.add(u.getID());
        }

        ApiResponse<List<Integer>> resp = new ApiResponse<>(
                true,
                "Your followers retrieved",
                followers
        );
        return Response.ok(resp).build();
    }

    @GET
    @Path("/get_own_following")
    public Response getOwnFollowing(@Context HttpServletRequest request) {
        Integer userId = Integer.parseInt((String) request.getAttribute("userId"));
        User requester = UserHandler.getInstance().getUser(userId);
        if (requester == null) {
            ApiResponse<Void> error = new ApiResponse<>(false, "User does not exist", null);
            return Response.status(Response.Status.UNAUTHORIZED).entity(error).build();
        }
        List<Integer> followers = new ArrayList<>();
        for(User u:FollowHandler.getInstance().getFollowers(userId)){
            followers.add(u.getID());
        }

        ApiResponse<List<Integer>> resp = new ApiResponse<>(
                true,
                "Your followers retrieved",
                followers
        );
        return Response.ok(resp).build();
    }

    static class FollowUnfolllowRequest {
        public Integer userId;
    }

}
