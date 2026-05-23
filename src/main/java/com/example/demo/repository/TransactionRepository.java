package com.example.demo.repository;

import com.example.demo.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
}