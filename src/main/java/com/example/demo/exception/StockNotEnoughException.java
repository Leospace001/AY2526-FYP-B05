package com.example.demo.exception;

public class StockNotEnoughException extends RuntimeException{
    public StockNotEnoughException(String message) {
        super(message);
    }
}