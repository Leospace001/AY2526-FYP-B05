package com.example.demo.security;

import com.example.demo.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.*;
import java.util.stream.Collectors;
import com.example.demo.model.UserRoleAssignment;

public class CustomUserDetails implements UserDetails {
    
    private final String username;
    private final String password;
    private final Collection<? extends GrantedAuthority> authorities;
    private final String email;
    private final User user;

    public CustomUserDetails(User user) {
        this.username = user.getUsername();
        this.password = user.getPassword();
        this.email = user.getEmail();
        this.user = user;

        // This takes your active role assignments and converts them into Spring Security authorities
        // this.authorities = user.getRoleAssignments().stream()
        //         .filter(assignment -> assignment.isActive())
        //         .map(assignment -> new SimpleGrantedAuthority(assignment.getRole().getName().name()))
        //         .collect(Collectors.toList());

        this.authorities = user.getRoleAssignments().stream()
        .collect(Collectors.groupingBy(
            assignment -> assignment.getRole(),
            Collectors.collectingAndThen(
                Collectors.maxBy(Comparator.comparing(UserRoleAssignment::getAssignedDate)),
                optional -> optional.filter(UserRoleAssignment::isActive) // 最新の割り当てがアクティブかどうかを確認
                    .map(assignment -> new SimpleGrantedAuthority(assignment.getRole().getName().name()))
        )
    ))
        .values().stream()
            .flatMap(Optional::stream) // Optionalの中身を取り出し、空ならスキップ
                .distinct() // ロールの重複を排除
                    .collect(Collectors.toList());
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { 
        return authorities; 
    }

    @Override
    public String getPassword() { 
        return password; 
    }

    @Override
    public String getUsername() { 
        return username; 
    }

    public User getUser() {
        return user;
    }

    public String getEmail() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() { 
        return true; 
    }

    @Override
    public boolean isAccountNonLocked() { 
        return true; 
    }

    @Override
    public boolean isCredentialsNonExpired() { 
        return true; 
    }

    @Override
    public boolean isEnabled() { 
        return true; 
    }
}