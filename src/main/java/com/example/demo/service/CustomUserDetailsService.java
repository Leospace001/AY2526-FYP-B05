package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.model.UserRoleAssignment;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import java.util.stream.Collectors;
import java.util.Comparator;
import java.util.Optional;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<SimpleGrantedAuthority> authorities = user.getRoleAssignments().stream()
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

        return new org.springframework.security.core.userdetails.User(
            user.getUsername(),
            user.getPassword(), // this is your BCrypt password
            authorities
        );
    }
}