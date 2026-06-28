package com.example.demo.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.demo.model.LogEvent;

public interface LogEventRepository extends JpaRepository<LogEvent, Long> {
    Page<LogEvent> findByUsernameContainingIgnoreCase(String username, Pageable pageable);
}
