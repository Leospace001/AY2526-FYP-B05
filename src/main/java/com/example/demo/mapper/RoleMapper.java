package com.example.demo.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValueCheckStrategy;

import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.model.UserRoleAssignment;
import com.example.demo.dto.*;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS
)
public interface RoleMapper {
     @Mapping(target = "name", source = "dto.name")
     @Mapping(target= "description", source = "dto.description")
     Role createRoleToRole(CreateRoleDto dto, @MappingTarget Role role);

     @Mapping(target = "user", source = "dto.user")
     @Mapping(target = "role", source = "dto.role")
     UserRoleAssignment addMemberToRoleDto (AddMemberToRoleDto dto,  @MappingTarget UserRoleAssignment userRoleAssignment);


}
