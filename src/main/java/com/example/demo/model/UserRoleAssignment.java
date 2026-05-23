package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "user_role_assignments")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserRoleAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(nullable = false)
    @CreationTimestamp
    private LocalDateTime assignedDate;

    // Helper flag to quickly filter active roles without checking null dates
    @Column(nullable = false)
    private boolean active = true;

    @Builder
    public UserRoleAssignment(User user, Role role) {
        this.user = user;
        this.role = role;
        this.assignedDate = LocalDateTime.now();
        this.active = true;
    }

}