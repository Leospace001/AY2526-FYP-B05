package com.example.demo.service;

import com.example.demo.dto.UserAccountUpdateRequest;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User registerUser(User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new IllegalStateException("Username is already taken.");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    @Transactional
    public User updateAccount(User currentUser, UserAccountUpdateRequest request) {
        if (!currentUser.getUsername().equals(request.getUsername()) && userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalStateException("Username is already taken.");
        }

        currentUser.setUsername(request.getUsername());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            currentUser.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        return userRepository.save(currentUser);
    }
}
