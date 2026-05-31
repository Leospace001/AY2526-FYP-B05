package com.example.demo.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import com.example.demo.dto.AddMemberToRoleDto;
import com.example.demo.dto.CreateRoleDto;
import com.example.demo.dto.UserRegister;
import com.example.demo.mapper.RoleMapper;
import com.example.demo.mapper.UserMapper;
import com.example.demo.model.ERole;
import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.model.UserRoleAssignment;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.UserRoleAssignmentRepository;
import com.example.demo.service.RoleAssignmentService;
import com.example.demo.service.UserService;

@Configuration
public class DataSeeder implements CommandLineRunner {

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    UserRoleAssignmentRepository userRoleAssignmentRepository;

    @Autowired
    UserMapper userMapper;

    @Autowired
    RoleMapper roleMapper;
    
    @Autowired
    UserService userService;

    @Autowired
    RoleAssignmentService roleAssignmentService;

    @Override
    public void run (String... args) {

        if (userRoleAssignmentRepository.count() == 0) {
            CreateRoleDto adminDto = new CreateRoleDto (
                ERole.ROLE_ADMIN,
                "administrator"
            );

            CreateRoleDto userDto = new CreateRoleDto(
                ERole.ROLE_USER,
                "normal user"
            );

            Role adminRole = new Role();
            roleMapper.createRoleToRole(adminDto, adminRole);

            Role userRole = new Role();
            roleMapper.createRoleToRole(userDto, userRole);

            roleRepository.save(adminRole);
            roleRepository.save(userRole);


            UserRegister testingAdminAccount = new UserRegister(
                "Leo",
                "Yuen",
                "admin",
                "P@ssw0rd",
                "230493658@stu.vtc.edu.hk",
                20,
                22222222
            );
            User adminUser = new User();
            userMapper.userRegisterDto(testingAdminAccount, adminUser);
            adminUser.setPassword(userService.getPasswordEncoder().encode(adminUser.getPassword()));
            // userService.registerUser(testingAdminAccount);

            UserRegister testingUserAccount = new UserRegister(
                "Max",
                "Yuen",
                "testing",
                "P@ssw0rd",
                "230686966@stu.vtc.edu.hk",
                20,
                22222222
            );
            User normalUser = new User();
            userMapper.userRegisterDto(testingUserAccount, normalUser);
            normalUser.setPassword(userService.getPasswordEncoder().encode(normalUser.getPassword()));
            // userService.registerUser(testingUserAccount);
            UserRoleAssignment adminAssignment = new UserRoleAssignment(adminUser, adminRole);
            UserRoleAssignment adminWithAssignment = new UserRoleAssignment(adminUser, userRole);
            UserRoleAssignment userAssignment = new UserRoleAssignment(normalUser, userRole);
            adminUser.getRoleAssignments().add(adminAssignment);
            adminUser.getRoleAssignments().add(adminWithAssignment);
            normalUser.getRoleAssignments().add(userAssignment);
            userRepository.save(normalUser);
            userRepository.save(adminUser);

            // roleAssignmentService.grantAdminRole(normalUser);
        }
    }

}