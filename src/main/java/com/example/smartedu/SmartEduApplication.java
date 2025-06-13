package com.example.smartedu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SmartEduApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartEduApplication.class, args);
    }

}
