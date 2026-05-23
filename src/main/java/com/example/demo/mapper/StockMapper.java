package com.example.demo.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.NullValueCheckStrategy;
import com.example.demo.dto.StockRequestDto;
import com.example.demo.dto.StockResponseDto;
import com.example.demo.model.Stock;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS
)
public interface StockMapper {
    
    Stock stockDtoToStock(StockResponseDto stockDto);

    // 🟢 FIXED: Removed the ignore rule so the path is copied to the response JSON
    StockResponseDto StocktoResponseDto(Stock stock);

    // Keep this one ignored, because RequestDto uses a MultipartFile, not a String path!
    @Mapping(target = "imagePath", ignore = true)
    Stock stockRequestDtoToStock(StockRequestDto stockDto);
}