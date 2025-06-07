package com.example.smartedu.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileService {
    
    @Value("${file.upload.path}")
    private String uploadPath;
    
    /**
     * 保存上传的文件
     */
    public String saveFile(MultipartFile file) throws IOException {
        // 创建上传目录
        Path uploadDir = Paths.get(uploadPath);
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }
        
        // 生成唯一文件名
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = UUID.randomUUID().toString() + extension;
        
        // 保存文件
        Path filePath = uploadDir.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        return filename;
    }
    
    /**
     * 提取文件文本内容
     */
    public String extractTextContent(String filename) {
        try {
            Path filePath = Paths.get(uploadPath, filename);
            String extension = getFileExtension(filename).toLowerCase();
            
            switch (extension) {
                case "txt":
                    return Files.readString(filePath);
                case "pdf":
                    return extractPdfContent(filePath);
                case "doc":
                case "docx":
                    return extractWordContent(filePath);
                default:
                    return "不支持的文件格式";
            }
        } catch (Exception e) {
            e.printStackTrace();
            return "文件内容提取失败：" + e.getMessage();
        }
    }
    
    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String filename) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf(".") + 1);
        }
        return "";
    }
    
    /**
     * 提取PDF内容（简化实现）
     */
    private String extractPdfContent(Path filePath) {
        // 这里应该使用PDF解析库如Apache PDFBox
        // 为了简化，这里返回模拟内容
        return "PDF文件内容提取功能需要集成PDF解析库";
    }
    
    /**
     * 提取Word文档内容（简化实现）
     */
    private String extractWordContent(Path filePath) {
        // 这里应该使用Apache POI库
        // 为了简化，这里返回模拟内容
        return "Word文档内容提取功能需要集成Apache POI库";
    }
    
    /**
     * 删除文件
     */
    public boolean deleteFile(String filename) {
        try {
            Path filePath = Paths.get(uploadPath, filename);
            return Files.deleteIfExists(filePath);
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * 获取文件完整路径
     */
    public String getFilePath(String filename) {
        return Paths.get(uploadPath, filename).toString();
    }
} 