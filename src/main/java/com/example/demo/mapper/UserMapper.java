package com.example.demo.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValueCheckStrategy;
import com.example.demo.model.User;
import com.example.demo.dto.UserInfo;

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
    @Mapping(target = "birthday", source = "userInfo.birthday")
    @Mapping(target = "age", source = "userInfo.age")
    @Mapping(target = "phone", source = "userInfo.phone")
    User updateEntityFromDto(UserInfo userInfo, @MappingTarget User user);
}
