package com.example.demo.repository;

import com.example.demo.model.FlowerCollection;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FlowerCollectionRepository extends JpaRepository<FlowerCollection, UUID> {
    List<FlowerCollection> findByUserOrderByCollectedAtDesc(User user);
}
