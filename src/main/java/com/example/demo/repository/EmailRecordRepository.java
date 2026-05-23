package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.demo.model.EmailRecord;


public interface EmailRecordRepository extends JpaRepository<EmailRecord, Long> {

}