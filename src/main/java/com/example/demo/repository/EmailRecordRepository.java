package com.example.demo.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.demo.model.EmailRecord;

public interface EmailRecordRepository extends JpaRepository<EmailRecord, Long> {

    List<EmailRecord> findByCreatedBy_IdOrderByCreatedAtDesc(Long userId);

    List<EmailRecord> findByCreatedBy_IdAndSentTrueOrderByUpdatedAtDesc(Long userId);

    List<EmailRecord> findByCreatedBy_IdAndSentFalseAndScheduledSendTimeNotNullAndScheduledSendTimeAfterOrderByScheduledSendTimeAsc(
            Long userId, LocalDateTime now);

    List<EmailRecord> findBySentFalseAndDispatchedFalseAndScheduledSendTimeLessThanEqual(LocalDateTime now);

    Optional<EmailRecord> findByIdAndCreatedBy_Id(Long id, Long userId);
}
