package com.example.demo.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValueCheckStrategy;

import com.example.demo.dto.StockRequestDto;
import com.example.demo.dto.StockResponseDto;
import com.example.demo.model.EmailRecord;
import com.example.demo.model.Stock;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS
)
public interface StockMapper {
    
    @Mapping(target = "imagePath", ignore = true)
    Stock stockDtoToStock(StockResponseDto stockDto);

    @Mapping(target = "imagePath", ignore = true)
    StockResponseDto StocktoResponseDto(Stock stock);

    @Mapping(target = "imagePath", ignore = true)
    Stock stockRequestDtoToStock(StockRequestDto stockDto);

}
