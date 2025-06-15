package com.example.smartedu.service;

import com.example.smartedu.model.TextChunk;


import org.apache.tika.Tika;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class DocumentProcessingService {
    
    private static final int DEFAULT_CHUNK_SIZE = 500; // 默认分块大小
    private static final int CHUNK_OVERLAP = 50; // 分块重叠大小
    private static final Pattern SENTENCE_PATTERN = Pattern.compile("[。！？;；]");
    private static final Pattern PARAGRAPH_PATTERN = Pattern.compile("\n\n+");
    
    /**
     * 文档块信息
     */
    public static class DocumentChunk {
        private String id;
        private String content;
        private String sourceFile;
        private int chunkIndex;
        private int startPosition;
        private int endPosition;
        
        public DocumentChunk(String content, String sourceFile, int chunkIndex, int startPosition, int endPosition) {
            this.id = UUID.randomUUID().toString();
            this.content = content;
            this.sourceFile = sourceFile;
            this.chunkIndex = chunkIndex;
            this.startPosition = startPosition;
            this.endPosition = endPosition;
        }
        
        // Getters
        public String getId() { return id; }
        public String getContent() { return content; }
        public String getSourceFile() { return sourceFile; }
        public int getChunkIndex() { return chunkIndex; }
        public int getStartPosition() { return startPosition; }
        public int getEndPosition() { return endPosition; }
    }
    
    /**
     * 处理文档并进行分块
     */
    public List<DocumentChunk> processDocument(File file) throws IOException {
        String content = extractTextFromFile(file);
        return chunkText(content, file.getName());
    }
    
    /**
     * 从文件提取文本内容
     */
    public String extractTextFromFile(File file) throws IOException {
        String fileName = file.getName().toLowerCase();
        
        if (fileName.endsWith(".txt")) {
            return extractFromTextFile(file);
        } else if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) {
            return extractFromWordDocument(file);
        } else if (fileName.endsWith(".pdf")) {
            return extractFromPdfDocument(file);
        } else if (fileName.endsWith(".html") || fileName.endsWith(".htm")) {
            return extractFromHtmlDocument(file);
        } else {
            throw new IOException("不支持的文件格式。支持的格式：TXT、DOC、DOCX、PDF、HTML");
        }
    }
    
    /**
     * 提取纯文本文件内容
     */
    private String extractFromTextFile(File file) throws IOException {
        byte[] bytes = Files.readAllBytes(file.toPath());
        
        // 尝试多种编码
        String[] encodings = {"UTF-8", "GBK", "GB2312", "ISO-8859-1"};
        
        for (String encoding : encodings) {
            try {
                String content = new String(bytes, encoding);
                // 检查是否包含中文字符（简单判断编码是否正确）
                if (containsChinese(content) || encoding.equals("UTF-8")) {
                    return content.trim();
                }
            } catch (Exception e) {
                // 继续尝试下一种编码
            }
        }
        
        // 默认使用UTF-8
        return new String(bytes, "UTF-8").trim();
    }
    
    /**
     * 提取Word文档内容（优先使用Tika）
     */
    private String extractFromWordDocument(File file) throws IOException {
        try {
            // 直接使用Tika解析Word文档，更稳定
            String content = extractWithTika(file);
            System.out.println("成功使用Tika解析Word文件: " + file.getName() + ", 内容长度: " + content.length());
            return content;
        } catch (Exception e) {
            System.err.println("Word文档解析失败: " + file.getName() + ", 错误: " + e.getMessage());
            throw new IOException("无法解析Word文档: " + e.getMessage(), e);
        }
    }
    
    /**
     * 提取PDF文档内容（使用Tika）
     */
    private String extractFromPdfDocument(File file) throws IOException {
        try {
            String content = extractWithTika(file);
            System.out.println("成功使用Tika解析PDF文件: " + file.getName() + ", 内容长度: " + content.length());
            return content;
        } catch (Exception e) {
            System.err.println("PDF文档解析失败: " + file.getName() + ", 错误: " + e.getMessage());
            throw new IOException("无法解析PDF文档: " + e.getMessage(), e);
        }
    }
    
    /**
     * 提取HTML文档内容（使用Tika）
     */
    private String extractFromHtmlDocument(File file) throws IOException {
        try {
            String content = extractWithTika(file);
            System.out.println("成功使用Tika解析HTML文件: " + file.getName() + ", 内容长度: " + content.length());
            return content;
        } catch (Exception e) {
            System.err.println("HTML文档解析失败: " + file.getName() + ", 错误: " + e.getMessage());
            throw new IOException("无法解析HTML文档: " + e.getMessage(), e);
        }
    }
    

    
    /**
     * 使用Apache Tika提取文档内容（备选方案）
     */
    private String extractWithTika(File file) throws IOException {
        try {
            Tika tika = new Tika();
            tika.setMaxStringLength(1024 * 1024); // 限制最大1MB文本
            String content = tika.parseToString(file);
            System.out.println("使用Tika成功解析文件: " + file.getName() + ", 内容长度: " + content.length());
            return content.trim();
        } catch (Exception e) {
            System.err.println("Tika解析也失败: " + file.getName() + ", 错误: " + e.getMessage());
            throw new IOException("无法解析文档内容: " + e.getMessage(), e);
        }
    }
    

    
    /**
     * 检查文本是否包含中文字符
     */
    private boolean containsChinese(String text) {
        return text != null && text.matches(".*[\\u4e00-\\u9fff].*");
    }
    
    /**
     * 智能文本分块
     */
    public List<DocumentChunk> chunkText(String text, String sourceFile) {
        List<DocumentChunk> chunks = new ArrayList<>();
        
        if (text == null || text.trim().isEmpty()) {
            return chunks;
        }
        
        // 首先按段落分割
        String[] paragraphs = PARAGRAPH_PATTERN.split(text);
        List<String> processedParagraphs = new ArrayList<>();
        
        for (String paragraph : paragraphs) {
            paragraph = paragraph.trim();
            if (!paragraph.isEmpty()) {
                if (paragraph.length() <= DEFAULT_CHUNK_SIZE) {
                    processedParagraphs.add(paragraph);
                } else {
                    // 长段落按句子分割
                    processedParagraphs.addAll(splitLongParagraph(paragraph));
                }
            }
        }
        
        // 合并小段落为合适大小的块
        List<String> finalChunks = mergeSmallChunks(processedParagraphs);
        
        // 创建文档块对象
        int currentPosition = 0;
        for (int i = 0; i < finalChunks.size(); i++) {
            String chunkContent = finalChunks.get(i);
            int startPos = currentPosition;
            int endPos = currentPosition + chunkContent.length();
            
            chunks.add(new DocumentChunk(
                chunkContent,
                sourceFile,
                i,
                startPos,
                endPos
            ));
            
            currentPosition = endPos;
        }
        
        return chunks;
    }
    
    /**
     * 分割长段落
     */
    private List<String> splitLongParagraph(String paragraph) {
        List<String> parts = new ArrayList<>();
        
        // 按句子分割
        String[] sentences = SENTENCE_PATTERN.split(paragraph);
        StringBuilder currentPart = new StringBuilder();
        
        for (String sentence : sentences) {
            sentence = sentence.trim();
            if (sentence.isEmpty()) continue;
            
            // 如果添加这个句子会超过限制，先保存当前部分
            if (currentPart.length() + sentence.length() > DEFAULT_CHUNK_SIZE && currentPart.length() > 0) {
                parts.add(currentPart.toString().trim());
                currentPart = new StringBuilder();
            }
            
            currentPart.append(sentence);
            if (!sentence.matches(".*[。！？]$")) {
                currentPart.append("。"); // 补充句号
            }
        }
        
        // 添加最后一部分
        if (currentPart.length() > 0) {
            parts.add(currentPart.toString().trim());
        }
        
        return parts;
    }
    
    /**
     * 合并小块为合适大小
     */
    private List<String> mergeSmallChunks(List<String> paragraphs) {
        List<String> mergedChunks = new ArrayList<>();
        StringBuilder currentChunk = new StringBuilder();
        
        for (String paragraph : paragraphs) {
            // 如果当前块加上新段落超过限制，先保存当前块
            if (currentChunk.length() + paragraph.length() > DEFAULT_CHUNK_SIZE && currentChunk.length() > 0) {
                mergedChunks.add(currentChunk.toString().trim());
                currentChunk = new StringBuilder();
            }
            
            if (currentChunk.length() > 0) {
                currentChunk.append("\n\n");
            }
            currentChunk.append(paragraph);
        }
        
        // 添加最后一块
        if (currentChunk.length() > 0) {
            mergedChunks.add(currentChunk.toString().trim());
        }
        
        return mergedChunks;
    }
    
    /**
     * 清理和预处理文本
     */
    public String cleanText(String text) {
        if (text == null) {
            return "";
        }
        
        return text
                // 移除多余空白字符
                .replaceAll("\\s+", " ")
                // 移除特殊控制字符
                .replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]", "")
                // 统一换行符
                .replaceAll("\\r\\n|\\r", "\n")
                // 移除首尾空白
                .trim();
    }
    
    /**
     * 获取文档统计信息
     */
    public DocumentStats getDocumentStats(File file) throws IOException {
        String content = extractTextFromFile(file);
        List<DocumentChunk> chunks = chunkText(content, file.getName());
        
        return new DocumentStats(
                file.getName(),
                file.length(),
                content.length(),
                chunks.size(),
                countChinese(content),
                countWords(content)
        );
    }
    
    /**
     * 统计中文字符数
     */
    private int countChinese(String text) {
        if (text == null) return 0;
        return (int) text.chars()
                .filter(ch -> ch >= 0x4e00 && ch <= 0x9fff)
                .count();
    }
    
    /**
     * 统计词数（简单按空格分割）
     */
    private int countWords(String text) {
        if (text == null || text.trim().isEmpty()) return 0;
        return text.trim().split("\\s+").length;
    }
    
    /**
     * 文档统计信息
     */
    public static class DocumentStats {
        private final String fileName;
        private final long fileSize;
        private final int textLength;
        private final int chunkCount;
        private final int chineseCharCount;
        private final int wordCount;
        
        public DocumentStats(String fileName, long fileSize, int textLength, 
                           int chunkCount, int chineseCharCount, int wordCount) {
            this.fileName = fileName;
            this.fileSize = fileSize;
            this.textLength = textLength;
            this.chunkCount = chunkCount;
            this.chineseCharCount = chineseCharCount;
            this.wordCount = wordCount;
        }
        
        // Getters
        public String getFileName() { return fileName; }
        public long getFileSize() { return fileSize; }
        public int getTextLength() { return textLength; }
        public int getChunkCount() { return chunkCount; }
        public int getChineseCharCount() { return chineseCharCount; }
        public int getWordCount() { return wordCount; }
    }
    
    /**
     * 将文本分割为TextChunk列表
     */
    public List<TextChunk> splitTextIntoChunks(String text, String sourceFile) {
        List<DocumentChunk> documentChunks = chunkText(text, sourceFile);
        List<TextChunk> textChunks = new ArrayList<>();
        
        for (DocumentChunk chunk : documentChunks) {
            textChunks.add(new TextChunk(
                chunk.getContent(),
                chunk.getChunkIndex(),
                chunk.getSourceFile()
            ));
        }
        
        return textChunks;
    }
} 