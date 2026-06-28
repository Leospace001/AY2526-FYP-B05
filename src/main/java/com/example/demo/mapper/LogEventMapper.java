package com.example.demo.mapper;

import org.springframework.stereotype.Component;
import com.example.demo.dto.LogEventDto;
import com.example.demo.model.LogEvent;

@Component
public class LogEventMapper {

    public LogEventDto toDto(LogEvent event) {
        LogEventDto dto = new LogEventDto();
        dto.setId(event.getId());
        dto.setUsername(event.getUsername());
        dto.setPath(event.getPath());
        dto.setHttpMethod(event.getHttpMethod());
        dto.setActionAt(event.getLoggedInAt());
        dto.setDurationMs(event.getDuration() != null ? event.getDuration().toEpochMilli() : null);
        return dto;
    }
}
