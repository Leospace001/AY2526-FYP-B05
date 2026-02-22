package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public User registerUser(User user) {
        String username = user.getUsername();
        String firstName = user.getFirstname();
        String lastName = user.getLastname();
        String email = user.getEmail();
        String rawPassword = user.getPassword();
        boolean isAdmin = (boolean)user.isAdmin();
        boolean isActive = (boolean) user.isActive();
        
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        String encodedPassword = passwordEncoder.encode(rawPassword);
        User newUser = new User(firstName, lastName, username, email, encodedPassword, isAdmin, isActive);
        userRepository.save(newUser);
        return newUser;
    }
}