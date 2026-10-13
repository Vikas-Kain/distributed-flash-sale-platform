package com.platform.ticketing.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
@EnableKafka
public class KafkaConfig {

    @Value("${app.kafka.topics.ticket-orders:ticket-orders-topic}")
    private String ticketOrdersTopic;

    @Bean
    @Profile("docker")
    public NewTopic ticketOrdersTopic() {
        return TopicBuilder.name(ticketOrdersTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
