package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "email_records")
@Getter @Setter
@AllArgsConstructor
@NoArgsConstructor
public class EmailRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "recipients", columnDefinition = "jsonb", nullable = false)
    private List<String> recipients = new ArrayList<>();

    private String subject;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String body;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attachment_paths", columnDefinition = "jsonb", nullable = false)
    private List<String> attachmentPaths = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime scheduledSendTime;

    @Column(nullable = true, columnDefinition = "boolean default false")
    private boolean sent;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean dispatched;
}
