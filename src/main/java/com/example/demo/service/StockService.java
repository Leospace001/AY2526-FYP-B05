package com.example.demo.service;

import java.io.IOException;
import java.nio.file.Files;
import java.util.List;
import com.example.demo.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.Path;
import com.example.demo.repository.StockRepository;
import org.springframework.beans.factory.annotation.Value;

import com.example.demo.dto.StockRequestDto;
import com.example.demo.dto.StockResponseDto;
import com.example.demo.mapper.StockMapper;
import com.example.demo.model.Stock;

@Service
public class StockService {

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private StockMapper stockMapper;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public Stock findById(Long id) {
        Stock stock = stockRepository.findById(id).orElseThrow();
        return stock;
    }

    public List<Stock> findAll() {
        List<Stock> stocks = stockRepository.findAll();
        return stocks;
    }

    public List<Stock> findByName(String name) {
        return stockRepository.findByName(name);
    }

    public StockResponseDto addStock(StockRequestDto dto, User user) {
        MultipartFile file = dto.getImageFile();
        Stock stock = stockMapper.stockRequestDtoToStock(dto);
        try {
            if (!file.isEmpty()) {
                String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                Path targetPath = Paths.get(uploadDir).resolve(fileName);
                Files.createDirectories(targetPath.getParent());
                file.transferTo(targetPath.toFile());
                stock.setImagePath(targetPath.toString());
            }
            stock.setCreatedBy(user);
            stockRepository.save(stock);
            return stockMapper.StocktoResponseDto(stock);
        } catch (Exception e) {
            throw new RuntimeException("Could not queue email", e);
        }

    }
}
