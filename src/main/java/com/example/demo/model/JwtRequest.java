package com.example.demo.model;

import io.swagger.v3.oas.annotations.media.Schema;

public class JwtRequest {
    @Schema(description = "The username of the user", defaultValue = "testing")
    private String username;
    @Schema(description = "The password of the user", defaultValue = "P@ssw0rd")
    private String password;

    public JwtRequest() {}

    public JwtRequest(String username, String password) {
        this.username = username;
        this.password = password;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}