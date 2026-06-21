package com.example.demo.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatGroupDetailDto {
    private ChatGroupDto group;
    private List<ChatGroupMemberDto> members = new ArrayList<>();
}
