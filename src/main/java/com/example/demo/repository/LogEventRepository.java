package com.example.demo.repository;

import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.demo.model.LogEvent;

import java.util.Optional;

public interface LogEventRepository extends JpaRepository<LogEvent, Long> {
    Optional<LogEvent> findByUsername(String username);
}