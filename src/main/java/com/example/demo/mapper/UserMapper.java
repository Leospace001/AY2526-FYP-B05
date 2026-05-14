package com.example.demo.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;
import org.mapstruct.Mapping;

import com.example.demo.model.User;
import com.example.demo.dto.UserInfo;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS
)
public interface UserMapper {
		// 實例化Mapstruct
    // UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);
    UserInfo userToUserInfo(User user);

    User userInfoToUser(UserInfo userInfo);
}
