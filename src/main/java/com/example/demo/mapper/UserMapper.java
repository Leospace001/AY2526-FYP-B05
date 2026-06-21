package com.example.demo.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValueCheckStrategy;
import com.example.demo.model.User;
import com.example.demo.dto.*;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS
)
public interface UserMapper {
    UserInfo userToUserInfo(User user);

    User userInfoToUser(UserInfo userInfo);

    @Mapping(target = "firstname", source = "userInfo.firstname")
    @Mapping(target = "lastname", source = "userInfo.lastname")
    @Mapping(target = "email", source = "userInfo.email")
    @Mapping(target = "username", source = "userInfo.username")
    @Mapping(target = "age", source = "userInfo.age")
    @Mapping(target = "phone", source = "userInfo.phone")
    @Mapping(target = "avatarPath", ignore = true)
    @Mapping(target = "avatarUrl", ignore = true)
    User updateEntityFromDto(UserInfo userInfo, @MappingTarget User user);

    @Mapping(target = "firstname", source = "userRegister.firstname")
    @Mapping(target = "lastname", source = "userRegister.lastname")
    @Mapping(target = "email", source = "userRegister.email")
    @Mapping(target = "username", source = "userRegister.username")
    @Mapping(target = "password", source = "userRegister.password")
    @Mapping(target = "age", source = "userRegister.age")
    @Mapping(target = "phone", source = "userRegister.phone")
    User userRegisterDto(UserRegister userRegister, @MappingTarget User user);
}
