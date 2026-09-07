package com.ethioevents;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EthioEventsApplication {
    public static void main(String[] args) {
        SpringApplication.run(EthioEventsApplication.class, args);
    }
}
