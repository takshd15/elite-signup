package com.example.elitescorebackend.res;

import com.example.elitescorebackend.encryption.Encrypt;
import com.example.elitescorebackend.handlers.*;
import com.example.elitescorebackend.models.ForgotPasswordToken;
import com.example.elitescorebackend.models.PreUser;
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

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

import static com.example.elitescorebackend.util.JwtUtil.extractUserId;


@Path("/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {
    public void notifyUser(String email, String code) {
        String apiKey = System.getenv("MJ_APIKEY_PUBLIC");
        String secretKey = System.getenv("MJ_APIKEY_PRIVATE");

        String auth = Base64.getEncoder().encodeToString((apiKey + ":" + secretKey).getBytes());

        String senderEmail = "calin.baculescu@gmail.com";
        String senderName = "Elite Score";

        String subject = "Your verification code";
        String text = "Your code is: " + code;
        String html = "<p>Your code is: <strong>" + code + "</strong></p>";

        // Use `String.format()` or multiline strings (Java 15+)
        String jsonBody = """
            {
              "Messages":[
                {
                  "From": {
                    "Email": "%s",
                    "Name": "%s"
                  },
                  "To": [
                    {
                      "Email": "%s",
                      "Name": "User"
                    }
                  ],
                  "Subject": "%s",
                  "TextPart": "%s",
                  "HTMLPart": "%s"
                }
              ]
            }
            """.formatted(senderEmail, senderName, email, subject, text, html);

        try {
            URL url = new URL("https://api.mailjet.com/v3.1/send");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("Authorization", "Basic " + auth);
            conn.setRequestProperty("Content-Type", "application/json");

            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonBody.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int status = conn.getResponseCode();
            System.out.println("Mailjet API response status: " + status);

            if (status >= 200 && status < 300) {
                System.out.println("Verification email sent to " + email);
            } else {
                System.out.println("Failed to send email. Status code: " + status);
                System.out.println(conn.getResponseMessage());
            }

            conn.disconnect();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @POST
    @Path("/pre-signup")
    public Response preSignUp(LoginRequest req){
        // Debug logging
        System.out.println("📥 Pre-signup request received");
        System.out.println("🔍 Request object: " + req);
        
        if(req == null) {
            System.out.println("❌ Request object is null");
            ApiResponse<Void> resp = new ApiResponse<>(false, "Request body is missing", null);
            return Response.status(Response.Status.BAD_REQUEST).entity(resp).build();
        }
        
        if(req.getUsername() == null || req.getEmail() == null){
            System.out.println("❌ Missing fields - username: " + req.getUsername() + ", email: " + req.getEmail());
            ApiResponse<Void> resp = new ApiResponse<>(false, "All fields must be completed", null);
            return Response.status(Response.Status.BAD_REQUEST).entity(resp).build();
        }
        for  (User u: UserHandler.getInstance().getAllUsers()) {
            if (u.getUsername().equals(req.getUsername()) || u.getEmail().equals(req.getEmail())) {
                System.out.println("❌ User already exists: " + req.getUsername() + " / " + req.getEmail());
                ApiResponse<Void> resp = new ApiResponse<>(false, "User with this email / Name exists", null);
                return Response.status(Response.Status.UNAUTHORIZED).entity(resp).build();
            }
        }
        PreUser u = new PreUser(req.getUsername(), req.getEmail());
        System.out.println("✅ Creating new pre-user: " + req.getUsername() + " (" + req.getEmail() + ")");
        PreUserHandler.getInstance().addPreUser(u);
        ApiResponse<Void> resp = new ApiResponse<>(true, "User registered successfully", null);
        return Response.status(Response.Status.OK).entity(resp).build();
    }


    @POST
    @Path("/login")
    @Produces(MediaType.APPLICATION_JSON)
    public Response login(@Context HttpServletRequest request, LoginRequest req){
        if(req.getUsername() == null || req.getPassword() == null){
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        for  (User u: UserHandler.getInstance().getAllUsers()){
            if(u.getUsername().equals(req.getUsername()) || u.getEmail().equals(req.getEmail())){
                if(Encrypt.verifyPassword(u.getPasswordHash(),req.getPassword())){
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
                        String code = handler.generateVerificationCode(u.getID(), (String) request.getAttribute("clientIp")
                        );
                        notifyUser(u.getEmail(), code);
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
            String code = VerificationCodeHandler.getInstance().generateVerificationCode(userId,
                    (String) request.getAttribute("clientIp"));
            notifyUser(UserHandler.getInstance().getUser(userId).getEmail(), code);

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
        if(req.getUsername() == null || req.getPassword() == null || req.getEmail() == null){
            ApiResponse<Void> resp = new ApiResponse<>(false, "All fields must be completed", null);
            return Response.status(Response.Status.BAD_REQUEST).entity(resp).build();
        }
        for  (User u: UserHandler.getInstance().getAllUsers()) {
            if (u.getUsername().equals(req.getUsername()) || u.getEmail().equals(req.getEmail())) {
                ApiResponse<Void> resp = new ApiResponse<>(false, "User with this email / username exists", null);
                return Response.status(Response.Status.UNAUTHORIZED).entity(resp).build();
            }
        }
        String passwordHash =  Encrypt.hashPassword(req.getPassword());
        User u = new User(req.getUsername(),passwordHash, UserRole.FREE,req.getEmail());
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
            if (u.getUsername().equals(req.getUsername())) {
                if (!req.getUsername().equals(extractUserId(token))) {
                    ApiResponse<Void> resp = new ApiResponse<>(false, "Nice try , wrong username for token", null);
                    return Response.status(Response.Status.BAD_REQUEST).entity(resp).build();
                } else {
                    u.setPasswordHash(Encrypt.hashPassword(req.getPassword()));
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
        private String username;
        private String email;
        private String password;
        
        // Default constructor required for JSON deserialization
        public LoginRequest() {}
        
        // Constructor with parameters
        public LoginRequest(String username, String email, String password) {
            this.username = username;
            this.email = email;
            this.password = password;
        }
        
        // Getters and setters required for JSON deserialization
        public String getUsername() { 
            return username; 
        }
        
        public void setUsername(String username) { 
            this.username = username; 
        }
        
        public String getEmail() { 
            return email; 
        }
        
        public void setEmail(String email) { 
            this.email = email; 
        }
        
        public String getPassword() { 
            return password; 
        }
        
        public void setPassword(String password) { 
            this.password = password; 
        }
        
        @Override
        public String toString() {
            return "LoginRequest{username='" + username + "', email='" + email + "'}";
        }
    }

}

