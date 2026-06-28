package com.example.demo.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

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
import com.example.demo.repository.UserIdentityRepository;
import com.example.demo.service.UserService;
import com.example.demo.service.AppSettingService;
import com.example.demo.service.EmailTemplateService;

@Configuration
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private RoleMapper roleMapper;

    @Autowired
    private UserService userService;

    @Autowired
    private UserIdentityRepository userIdentityRepository;

    @Autowired
    private AppSettingService appSettingService;

    @Autowired
    private EmailTemplateService emailTemplateService;

    @Override
    public void run(String... args) {
        appSettingService.ensureSetting(AppSettingService.REGISTRATION_EMAIL_ENABLED, "false");
        emailTemplateService.seedDefaultsIfMissing();

        Role adminRole = ensureRole(ERole.ROLE_ADMIN, "administrator");
        Role userRole = ensureRole(ERole.ROLE_USER, "normal user");

        ensureDefaultUser(
                new UserRegister("Leo", "Yuen", "admin", "P@ssw0rd", "230493658@stu.vtc.edu.hk", 20, 22222222),
                adminRole,
                userRole);
        ensureDefaultUser(
                new UserRegister("Max", "Yuen", "testing", "P@ssw0rd", "230686966@stu.vtc.edu.hk", 20, 22222222),
                userRole);
        backfillLocalLoginEnabled();
    }

    private void backfillLocalLoginEnabled() {
        userRepository.findAll().forEach(user -> {
            if (!user.isLocalLoginEnabled() && user.getPassword() != null) {
                boolean hasOAuthIdentity = !userIdentityRepository.findByUser_Id(user.getId()).isEmpty();
                if (!hasOAuthIdentity) {
                    user.setLocalLoginEnabled(true);
                    userRepository.save(user);
                }
            }
        });
    }

    private Role ensureRole(ERole roleName, String description) {
        return roleRepository.findByName(roleName).orElseGet(() -> {
            CreateRoleDto dto = new CreateRoleDto(roleName, description);
            Role role = new Role();
            roleMapper.createRoleToRole(dto, role);
            return roleRepository.save(role);
        });
    }

    private void ensureDefaultUser(UserRegister account, Role... roles) {
        if (userRepository.findByUsername(account.getUsername()).isPresent()) {
            return;
        }

        User user = new User();
        userMapper.userRegisterDto(account, user);
        user.setPassword(userService.getPasswordEncoder().encode(account.getPassword()));
        user.setActive(true);
        user.setLocalLoginEnabled(true);

        for (Role role : roles) {
            user.getRoleAssignments().add(new UserRoleAssignment(user, role));
        }

        userRepository.save(user);
    }
}
