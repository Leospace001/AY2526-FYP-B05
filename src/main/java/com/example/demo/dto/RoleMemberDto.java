package com.example.demo.dto;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.*;

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
