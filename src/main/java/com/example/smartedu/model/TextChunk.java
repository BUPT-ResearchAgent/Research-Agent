package com.example.smartedu.model;

/**
 * 文本分块类
 */
public class TextChunk {
    private String content;
    private int index;
    private String source;
    
    public TextChunk() {}
    
    public TextChunk(String content, int index, String source) {
        this.content = content;
        this.index = index;
        this.source = source;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public int getIndex() {
        return index;
    }
    
    public void setIndex(int index) {
        this.index = index;
    }
    
    public String getSource() {
        return source;
    }
    
    public void setSource(String source) {
        this.source = source;
    }
    
    @Override
    public String toString() {
        return "TextChunk{" +
                "content='" + content + '\'' +
                ", index=" + index +
                ", source='" + source + '\'' +
                '}';
    }
} 