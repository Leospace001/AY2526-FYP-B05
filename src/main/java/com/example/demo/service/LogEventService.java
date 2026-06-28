package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import com.example.demo.dto.LogEventDto;
import com.example.demo.mapper.LogEventMapper;
import com.example.demo.model.LogEvent;
import com.example.demo.repository.LogEventRepository;

@Service
public class LogEventService {

    @Autowired
    private LogEventRepository logEventRepository;

    @Autowired
    private LogEventMapper logEventMapper;

    public LogEvent createLogEvent(LogEvent logEvent) {
        return logEventRepository.save(logEvent);
    }

    public LogEvent getLogEventById(Long id) {
        return logEventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("LogEvent not found"));
    }

    public Page<LogEventDto> getPaginatedLogEvents(int page, int size, String username) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        PageRequest pageable = PageRequest.of(page, safeSize, Sort.by(Sort.Direction.DESC, "loggedInAt"));

        Page<LogEvent> events = (username != null && !username.isBlank())
                ? logEventRepository.findByUsernameContainingIgnoreCase(username.trim(), pageable)
                : logEventRepository.findAll(pageable);

        return events.map(logEventMapper::toDto);
    }
}
