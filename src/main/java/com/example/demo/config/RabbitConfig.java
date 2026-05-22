// src/main/java/com/example/demo/config/RabbitConfig.java
package com.example.demo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.amqp.support.converter.*;

@Configuration
public class RabbitConfig {
    
    @Value("${rabbitmq.queue.name}")
    private String queue;

    @Value("${rabbitmq.exchange.name}")
    private String exchange;

    @Value("${rabbitmq.routing.key}")
    private String routingKey;

    @Bean
    public Queue orderQueue() {
        return new Queue(queue); // durable queue
    }

    @Bean
    public TopicExchange orderExchange() {
        return new TopicExchange(exchange);
    }

  @Bean
    public MessageConverter myCustomJsonConverter() { // Unique name
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public Binding orderBinding() {
        return BindingBuilder.bind(orderQueue()).to(orderExchange()).with(routingKey);
    }
}
