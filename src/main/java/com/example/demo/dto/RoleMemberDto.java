package com.example.demo.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class RoleMemberDto {

    private Long userId;

    private String username;

    private String email;

    private LocalDateTime assignedDate;

    private boolean isActive;
}
