package com.example.demo.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.demo.repository.StockRepository;
import com.example.demo.model.Stock;

@Service
public class StockService {

    @Autowired
    private StockRepository stockRepository;


    public Stock findById (Long id) {
        Stock stock = stockRepository.findById(id).orElseThrow();
        return stock;
    }

    public List<Stock> findAll () {
        List<Stock> stocks = stockRepository.findAll();
        return stocks;
    }
}
