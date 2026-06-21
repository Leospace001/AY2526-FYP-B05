package com.example.demo.service;

import java.nio.file.Files;
import java.util.List;
import java.util.Set;
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
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import com.example.demo.dto.StockRequestDto;
import com.example.demo.dto.StockResponseDto;
import com.example.demo.mapper.StockMapper;
import com.example.demo.model.Stock;

@Service
public class StockService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "id", "name", "createdAt", "updatedAt", "sellingPrice", "quantity");

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

    public Page<StockResponseDto> getPaginatedStocks(
            String search, int page, int size, String sortBy, String sortDir, boolean includeInactive) {
        String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "id";
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(safeSortBy).ascending()
                : Sort.by(safeSortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        boolean hasSearch = search != null && !search.trim().isEmpty();
        String trimmedSearch = hasSearch ? search.trim() : "";

        Page<Stock> stockPage;
        if (includeInactive) {
            stockPage = hasSearch
                    ? stockRepository.findByNameContainingIgnoreCase(trimmedSearch, pageable)
                    : stockRepository.findAll(pageable);
        } else {
            stockPage = hasSearch
                    ? stockRepository.findByNameContainingIgnoreCaseAndActiveTrue(trimmedSearch, pageable)
                    : stockRepository.findByActiveTrue(pageable);
        }

        return stockPage.map(stock -> stockMapper.StocktoResponseDto(stock));
    }

    public List<Stock> findByName(String name) {
        return stockRepository.findByName(name);
    }

    public StockResponseDto setAvailability(Long id, boolean active) {
        Stock stock = stockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stock not found with ID: " + id));
        stock.setActive(active);
        return stockMapper.StocktoResponseDto(stockRepository.save(stock));
    }

    public StockResponseDto addStock(StockRequestDto dto, User user) {
        MultipartFile file = dto.getImageFile();
        Stock stock = stockMapper.stockRequestDtoToStock(dto);

        try {
            if (file != null && !file.isEmpty()) {
                String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                Path targetPath = Paths.get(uploadDir).resolve(fileName);
                Files.createDirectories(targetPath.getParent());
                file.transferTo(targetPath.toFile());
                stock.setImagePath(targetPath.toString());
            }

            stock.setCreatedBy(user);
            if (dto.getActive() != null) {
                stock.setActive(dto.getActive());
            }
            Stock savedStock = stockRepository.save(stock);
            return stockMapper.StocktoResponseDto(savedStock);

        } catch (Exception e) {
            userActivityLogger.error("Error creating stock record: ", e);
            throw new RuntimeException("Database insertion aborted due to file handling error", e);
        }
    }

    public StockResponseDto updateStock(Long id, StockRequestDto dto, User user) {
        Stock stock = stockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stock not found with ID: " + id));

        stockMapper.updateStockFromDto(dto, stock);

        MultipartFile file = dto.getImageFile();
        try {
            if (file != null && !file.isEmpty()) {
                String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                Path targetPath = Paths.get(uploadDir).resolve(fileName);
                Files.createDirectories(targetPath.getParent());
                file.transferTo(targetPath.toFile());
                stock.setImagePath(targetPath.toString());
            }

            Stock updatedStock = stockRepository.save(stock);
            return stockMapper.StocktoResponseDto(updatedStock);

        } catch (Exception e) {
            userActivityLogger.error("Error updating stock record ID " + id + ": ", e);
            throw new RuntimeException("Database update aborted due to file handling error", e);
        }
    }
}
