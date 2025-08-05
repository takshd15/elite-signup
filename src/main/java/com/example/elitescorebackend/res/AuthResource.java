package com.example.elitescorebackend.res;

import com.example.elitescorebackend.encryption.Encrypt;
import com.example.elitescorebackend.handlers.ForgotPasswordHandler;
import com.example.elitescorebackend.handlers.TokenRevocationHandler;
import com.example.elitescorebackend.handlers.UserHandler;
import com.example.elitescorebackend.handlers.VerificationCodeHandler;
import com.example.elitescorebackend.models.ForgotPasswordToken;
import com.example.elitescorebackend.models.VerificationCode;
import com.example.elitescorebackend.util.JwtUtil;
import com.example.elitescorebackend.models.User;
import com.example.elitescorebackend.models.enums.UserRole;
import com.example.elitescorebackend.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static com.example.elitescorebackend.util.JwtUtil.extractUserId;


@Path("/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {
    @POST
    @Path("/login")
    public Response login(@Context HttpServletRequest request, LoginRequest req){
        if(req.username == null || req.password == null){
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        for  (User u: UserHandler.getInstance().getAllUsers()){
            if(u.getUsername().equals(req.username) || u.getEmail().equals(req.email)){
                if(Encrypt.verifyPassword(u.getPasswordHash(),req.password)){
                    VerificationCodeHandler handler = VerificationCodeHandler.getInstance();
                    VerificationCode latestCode = handler.getLatestCodeForUser(u.getID());

                    if (latestCode != null && Instant.now().isBefore(latestCode.getExpiration_date()) && !latestCode.isUsed()) {
                        ApiResponse<String> resp = new ApiResponse<>(
                                true,
                                "Login success, waiting for code (use your last)",
                                JwtUtil.generateToken(String.valueOf(u.getID()))
                        );
                        return Response.status(Response.Status.OK).entity(resp).build();

                    } else if (handler.countCodesLastHour(u.getID()) < 4) {
                        handler.generateVerificationCode(u.getID(), (String) request.getAttribute("clientIp")
                        );
                        ApiResponse<String> resp = new ApiResponse<>(
                                true,
                                "Login success, waiting for code(sent another one)",
                                JwtUtil.generateToken(String.valueOf(u.getID()))
                        );
                        return Response.status(Response.Status.OK).entity(resp).build();

                    } else {
                        ApiResponse<String> resp = new ApiResponse<>(false,
                                "Too many verification code requests in the past hour; please wait before retrying",
                                null
                        );
                        return Response.status(Response.Status.TOO_MANY_REQUESTS).entity(resp).build();
                    }
                }else {
                    ApiResponse<Void> resp = new ApiResponse<>(false, "Wrong password", null);
                    return Response.status(Response.Status.UNAUTHORIZED).entity(resp).build();
                }
            }
        }
        ApiResponse<Void> resp = new ApiResponse<>(false, "User does not  exist", null);
        return Response.status(Response.Status.UNAUTHORIZED).entity(resp).build();

    }

    @GET
    @Path("/verify_code")
    public Response verify_code(@Context HttpServletRequest request,@QueryParam("code") Integer code){

        int userId = Integer.parseInt((String) request.getAttribute("userId"));

        if(code == null){
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        if(UserHandler.getInstance().getUser(userId) == null){
            ApiResponse<Void> resp = new ApiResponse<>(false, "User does not  exist", null);
            return Response.status(Response.Status.UNAUTHORIZED).entity(resp).build();
        }

        if(VerificationCodeHandler.getInstance().verifyAndMarkUsed(code,
                userId, (String) request.getAttribute("clientIp"))){

            ApiResponse<Void> resp = new ApiResponse<>(true, "Login success,code verified",null);
            return Response.status(Response.Status.OK).entity(resp).build();
        }else {
            ApiResponse<Void> resp = new ApiResponse<>(false, "Invalid Code!",null);
            return Response.status(Response.Status.OK).entity(resp).build();
        }

    }

    @POST
    @Path("/resend_code")
    public Response resend_code(@Context HttpServletRequest request){

        int userId = Integer.parseInt((String) request.getAttribute("userId"));

        if(UserHandler.getInstance().getUser(userId) == null){
            ApiResponse<Void> resp = new ApiResponse<>(false, "User does not  exist", null);
            return Response.status(Response.Status.UNAUTHORIZED).entity(resp).build();
        }

        if(VerificationCodeHandler.getInstance().countCodesLastHour(userId) < 4){
            VerificationCodeHandler.getInstance().generateVerificationCode(userId,
                    (String) request.getAttribute("clientIp"));

            ApiResponse<Void> resp = new ApiResponse<>(true, "Code regenerated!",null);
            return Response.status(Response.Status.OK).entity(resp).build();
        }else {
            ApiResponse<Void> resp = new ApiResponse<>(false, "Generated too many codes in one hour!",null);
            return Response.status(Response.Status.FORBIDDEN).entity(resp).build();
        }

    }

    @POST
    @Path("/signup")
    public Response signup(LoginRequest req){
        if(req.username == null || req.password == null || req.email == null){
            ApiResponse<Void> resp = new ApiResponse<>(false, "All fields must be completed", null);
            return Response.status(Response.Status.BAD_REQUEST).entity(resp).build();
        }
        for  (User u: UserHandler.getInstance().getAllUsers()) {
            if (u.getUsername().equals(req.username) || u.getEmail().equals(req.email)) {
                ApiResponse<Void> resp = new ApiResponse<>(false, "User with this email / username exists", null);
                return Response.status(Response.Status.UNAUTHORIZED).entity(resp).build();
            }
        }
        String passwordHash =  Encrypt.hashPassword(req.password);
        User u = new User(req.username,passwordHash, UserRole.FREE,req.email);
        UserHandler.getInstance().addUser(u);
        ApiResponse<Void> resp = new ApiResponse<>(true, "User registered successfully", null);
        return Response.status(Response.Status.OK).entity(resp).build();
    }

    /**
     * Logs out a user by revoking the provided JWT token.
     *
     * @param authHeader the Authorization header containing the Bearer token.
     * @return a {@link Response} indicating logout success.
     *
     */
    @GET
    @Path("/logout")
    public Response logout(@HeaderParam("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String jti = JwtUtil.extractJti(token);
        TokenRevocationHandler.getInstance().revokeToken(jti);

        ApiResponse<Void> resp = new ApiResponse<>(true, "Logout successful", null);
        return Response.ok(resp).build();
    }


    @POST
    @Path("/forgot_password-{token}")
    public Response forgot_password(@PathParam("token") String token, LoginRequest req) {
        if(ForgotPasswordHandler.getInstance().getTokenByToken(token) == null || ForgotPasswordHandler.getInstance().getTokenByToken(token).isExpired()){
            ApiResponse<Void> resp = new ApiResponse<>(true, "Token Invalid/Expired", null);
            return Response.status(Response.Status.UNAUTHORIZED).entity(resp).build();
        }

        for (User u : UserHandler.getInstance().getAllUsers()) {
            if (u.getUsername().equals(req.username)) {
                if (!req.username.equals(extractUserId(token))) {
                    ApiResponse<Void> resp = new ApiResponse<>(false, "Nice try , wrong username for token", null);
                    return Response.status(Response.Status.BAD_REQUEST).entity(resp).build();
                } else {
                    u.setPasswordHash(Encrypt.hashPassword(req.password));
                    UserHandler.getInstance().updateUser(u);
                    ApiResponse<Void> resp = new ApiResponse<>(true, "Reset success", null);
                    ForgotPasswordHandler.getInstance().deleteToken(
                            ForgotPasswordHandler.getInstance().getTokenByToken(token).getId()
                    );
                    return Response.status(Response.Status.OK).entity(resp).build();
                    }
                }
            }
            ApiResponse<Void> resp = new ApiResponse<>(false, "User does not  exist", null);
            return Response.status(Response.Status.UNAUTHORIZED).entity(resp).build();

    }

    @POST
    @Path("/generate_login_token")
    public Response generate_login_token(@Context HttpServletRequest request) {

        int userId = (Integer) request.getAttribute("userId");
        User user = UserHandler.getInstance().getUser(userId);

        if (user == null) {
            ApiResponse<Void> resp = new ApiResponse<>(false, "User does not  exist", null);
            return Response.status(Response.Status.UNAUTHORIZED).entity(resp).build();
        }

        String token = JwtUtil.generateLoginToken(user.getUsername());
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        LocalDateTime now = LocalDateTime.now().plusHours(1);
        String exp = now.format(formatter);
        ForgotPasswordToken forgotPasswordToken = new ForgotPasswordToken(userId,token,exp);
        ForgotPasswordHandler.getInstance().addToken(forgotPasswordToken);
        ApiResponse<String> resp = new ApiResponse<>(true, "Token generated successfully",
                token);
        return Response.status(Response.Status.OK).entity(resp).build();
    }

    static class LoginRequest {
        public String username;
        public String email;
        public String password;
    }

}

