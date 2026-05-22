package com.example.demo.repository;

import com.example.demo.model.User;
import com.example.demo.model.Role;
import com.example.demo.model.UserRoleAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface UserRoleAssignmentRepository extends JpaRepository<UserRoleAssignment, Long> {
    List<UserRoleAssignment> findByRoleId(Long id);
    

}