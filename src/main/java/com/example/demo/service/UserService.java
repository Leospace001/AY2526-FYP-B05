package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.dto.UserInfo;
import com.example.demo.dto.UserRegister;
import com.example.demo.mapper.UserMapper;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public User registerUser(UserRegister userRegister) {
        User newUser = new User();
        userMapper.userRegisterDto(userRegister, newUser);
        String username = newUser.getUsername();
        String rawPassword = newUser.getPassword();
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        String encodedPassword = passwordEncoder.encode(rawPassword);
        newUser.setPassword(encodedPassword);
        Role defaultRole = roleRepository.findByName(ERole.ROLE_USER)
            .orElseThrow(() -> new RuntimeException("Default role not found."));
        // user.addRole(defaultRole);

        UserRoleAssignment defaultAssignment = new UserRoleAssignment(newUser, defaultRole);
        newUser.getRoleAssignments().add(defaultAssignment);
        userRepository.save(newUser);
        return newUser;
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateUser(String username, UserInfo userInfo) {
        User updatedUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userMapper.updateEntityFromDto(userInfo, updatedUser);
        userRepository.save(updatedUser);
        return updatedUser;
    }
}