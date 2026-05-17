package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.demo.model.LogEvent;
import com.example.demo.repository.LogEventRepository;

@Service
public class LogEventService {

    @Autowired
    private LogEventRepository logEventRepository;


    public LogEvent createLogEvent(LogEvent logEvent) {
        return logEventRepository.save(logEvent);
    }

    public LogEvent getLogEventById(Long id) {
        return logEventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("LogEvent not found"));
    }
}