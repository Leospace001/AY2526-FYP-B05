package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.dto.UserInfo;
import com.example.demo.dto.UserRegister;
import com.example.demo.exception.UserAlreadyExistsException;
import com.example.demo.mapper.UserMapper;
import com.example.demo.repository.UserRepository;

import lombok.Getter;

import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.PasswordResetTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Getter
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;
    
    public User registerUser(UserRegister userRegister) {
        User newUser = new User();
        userMapper.userRegisterDto(userRegister, newUser);
        String username = newUser.getUsername();
        String rawPassword = newUser.getPassword();
        if (userRepository.findByUsername(username).isPresent()) {
            throw new UserAlreadyExistsException("Username '" + newUser.getUsername() + "' is already taken.");
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

    public Page<UserInfo> getPaginatedUsers(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name()) 
                    ? Sort.by(sortBy).ascending() 
                    : Sort.by(sortBy).descending();
                    
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<User> userPage = userRepository.findAll(pageable);
        
        return userPage.map(user -> userMapper.userToUserInfo(user));
    }

    public User getUserByUsername (String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User findUserByEmail (String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User getUserByToken (String token) {
         PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token).orElseThrow();
         User user = resetToken.getUser();
         return user;
    }

    public User updateUser(String username, UserInfo userInfo, boolean isAdmin) {
        User updatedUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Backup the original active status before mapping overwrites it
        Boolean originalActiveStatus = updatedUser.isActive();

        // Let MapStruct copy all fields from the DTO to the Entity
        userMapper.updateEntityFromDto(userInfo, updatedUser);

        // Security Guard: If the user is NOT an admin, revert the active status to what it originally was
        if (!isAdmin && originalActiveStatus != null) {
            updatedUser.setActive(originalActiveStatus);
        }

        userRepository.save(updatedUser);
        return updatedUser;
    }

    public void createPasswordResetTokenForUser(User user, String token) {
        PasswordResetToken myToken = new PasswordResetToken(token, user, LocalDateTime.now().plusHours(1));
        passwordResetTokenRepository.save(myToken);
    }

    public String validatePasswordResetToken(String token) {
        return passwordResetTokenRepository.findByToken(token)
            .filter(t -> t.getExpiryDate().isAfter(LocalDateTime.now()))
            .filter (t -> t.isActive() == true)
            .map(t -> "valid")
            .orElse("invalid");
    }

    public void changeUserPassword(User user, String password) {
        user.setPassword(passwordEncoder.encode(password));
        userRepository.save(user);
    }

    public void invalidateToken (String token) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
            .orElseThrow(() -> new RuntimeException("Token not found"));;
        resetToken.setActive(false);
        passwordResetTokenRepository.save(resetToken);
    }
    
}