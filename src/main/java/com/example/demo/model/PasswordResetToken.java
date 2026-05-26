package com.example.demo.model;

import com.example.demo.model.BaseModel;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset")
@Getter
@Setter
@NoArgsConstructor
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String token;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User user;

    private LocalDateTime expiryDate;

    @Builder
    public PasswordResetToken(
        String token,
        User user,
        LocalDateTime expiryDate
    ) {
        this.token = token;
        this.user = user;
        this.expiryDate = expiryDate;
    }
}