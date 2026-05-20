package com.example.demo.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValueCheckStrategy;
import com.example.demo.model.EmailRecord;
import com.example.demo.dto.EmailRequestDto;
import com.example.demo.model.User;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS
)
public interface EmailRecordMapper {
    @Mapping(target = "createdBy", ignore = true)
    EmailRecord emailRequestDtoToEmailRecord(EmailRequestDto emailRequestDto);

    EmailRequestDto emailRecordToEmailRequestDto(EmailRecord emailRecord);

    default boolean mapStringToBoolean(String value) {
        return value != null && (value.equalsIgnoreCase("true") || value.equalsIgnoreCase("1"));
    }

     default String mapBooleanToString(boolean value) {
        return Boolean.toString(value);
    }
}
