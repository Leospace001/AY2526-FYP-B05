package com.example.demo.service;

import java.nio.file.Files;
import java.util.List;
import com.example.demo.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Paths;
import java.nio.file.Path;
import com.example.demo.repository.StockRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

    private static final Logger userActivityLogger = LoggerFactory.getLogger("UserActivity");

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

    public Page<StockResponseDto> getPaginatedStocks(int page, int size, String sortBy, String sortDir) {
        // 1. Establish the database sorting rules dynamically
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        // 2. Build the structural page parameters slice
        Pageable pageable = PageRequest.of(page, size, sort);

        // 3. Query the target chunk from the database
        Page<Stock> stockPage = stockRepository.findAll(pageable);

        // 4. Transform the inner database models using your mapping rules
        return stockPage.map(stock -> stockMapper.StocktoResponseDto(stock));
    }

    public List<Stock> findByName(String name) {
        return stockRepository.findByName(name);
    }

    public StockResponseDto addStock(StockRequestDto dto, User user) {
        MultipartFile file = dto.getImageFile();
        Stock stock = stockMapper.stockRequestDtoToStock(dto);

        try {
            // Safe Check: Ensure file object itself is not null before checking if it is
            // empty
            if (file != null && !file.isEmpty()) {
                String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                Path targetPath = Paths.get(uploadDir).resolve(fileName);
                Files.createDirectories(targetPath.getParent());
                file.transferTo(targetPath.toFile());
                stock.setImagePath(targetPath.toString());
            }

            stock.setCreatedBy(user);
            Stock savedStock = stockRepository.save(stock);
            return stockMapper.StocktoResponseDto(savedStock);

        } catch (Exception e) {
            userActivityLogger.error("Error creating stock record: ", e);
            throw new RuntimeException("Database insertion aborted due to file handling error", e);
        }
    }

    public StockResponseDto updateStock(Long id, StockRequestDto dto, User user) {
        // 1. Fetch the target stock item or throw an exception if invalid
        Stock stock = stockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stock not found with ID: " + id));

        // 2. Map updated primitives and text block data onto the managed entity
        stockMapper.updateStockFromDto(dto, stock);

        // 3. Handle optional multipart image updates
        MultipartFile file = dto.getImageFile();
        try {
            if (file != null && !file.isEmpty()) {
                String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                Path targetPath = Paths.get(uploadDir).resolve(fileName);
                Files.createDirectories(targetPath.getParent());
                file.transferTo(targetPath.toFile());
                stock.setImagePath(targetPath.toString()); // Update with new asset path location
            }

            // Save changes and map to response DTO format
            Stock updatedStock = stockRepository.save(stock);
            return stockMapper.StocktoResponseDto(updatedStock);

        } catch (Exception e) {
            userActivityLogger.error("Error updating stock record ID " + id + ": ", e);
            throw new RuntimeException("Database update aborted due to file handling error", e);
        }
    }
}
