package com.example.smartedu.config;

import io.milvus.client.MilvusServiceClient;
import io.milvus.param.ConnectParam;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MilvusConfig {
    
    @Value("${milvus.host:127.0.0.1}")
    private String milvusHost;
    
    @Value("${milvus.port:19530}")
    private int milvusPort;
    
    @Bean
    public MilvusServiceClient milvusClient() {
        ConnectParam connectParam = ConnectParam.newBuilder()
                .withHost(milvusHost)
                .withPort(milvusPort)
                .build();
        
        return new MilvusServiceClient(connectParam);
    }
} 