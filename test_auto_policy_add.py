#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试新课程自动添加重点政策文档功能
"""

import requests
import json
import time
from datetime import datetime

def wait_for_server(max_wait=60):
    """等待服务器启动"""
    print("等待服务器启动...")
    for i in range(max_wait):
        try:
            response = requests.get("http://localhost:8080", timeout=5)
            if response.status_code == 200:
                print("✅ 服务器已启动")
                return True
        except requests.exceptions.RequestException:
            pass
        if i % 10 == 0:
            print(f"等待中... ({i+1}/{max_wait})")
        time.sleep(1)
    return False

def login_as_teacher(session):
    """登录教师账户"""
    try:
        login_data = {
            "username": "teacher1",
            "password": "teacher123",
            "role": "teacher"
        }
        
        response = session.post(
            'http://localhost:8080/api/auth/login',
            json=login_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"✅ 教师登录成功")
                return True
            else:
                print(f"❌ 登录失败: {result.get('message', '未知错误')}")
                return False
        else:
            print(f"❌ 登录失败: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ 登录异常: {e}")
        return False

def create_test_course(session):
    """创建测试课程"""
    try:
        course_data = {
            "name": f"测试课程-自动政策文档-{datetime.now().strftime('%m%d%H%M')}",
            "description": "测试新课程自动添加重点政策文档功能",
            "credit": 3,
            "hours": 48,
            "semester": "2025春",
            "academicYear": "2024-2025",
            "classTime": "周三 14:00-16:00",
            "classLocation": "教学楼A101",
            "maxStudents": 50
        }
        
        response = session.post(
            'http://localhost:8080/api/teacher/courses',
            json=course_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                course = result.get('data')
                print(f"✅ 成功创建测试课程: {course['name']} (ID: {course['id']})")
                return course
            else:
                print(f"❌ 创建课程失败: {result.get('message', '未知错误')}")
                return None
        else:
            print(f"❌ 创建课程失败: HTTP {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ 创建课程异常: {e}")
        return None

def check_course_documents(session, course_id):
    """检查课程的知识库文档"""
    try:
        response = session.get(
            f'http://localhost:8080/api/teacher/knowledge/{course_id}/documents',
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                documents = result.get('data', [])
                print(f"\n📚 课程 {course_id} 的知识库文档 ({len(documents)} 个):")
                
                priority_docs = []
                other_docs = []
                
                for doc in documents:
                    filename = doc.get('originalName', '')
                    description = doc.get('description', '')
                    chunks = doc.get('chunksCount', 0)
                    
                    # 检查是否为重点政策文档
                    priority_files = [
                        "GBT+36436-2018.pdf",
                        "GBT+36437-2018.pdf", 
                        "GBT+45654-2025.pdf",
                        "GBZ+43946-2024.pdf",
                        "GBZ+45261-2025.pdf",
                        "GBZ+45262-2025.pdf",
                        "人工智能教育应用系列标准.pdf"
                    ]
                    
                    if filename in priority_files:
                        priority_docs.append(doc)
                        print(f"  🔖 {filename} - {chunks} 个知识块")
                        print(f"      {description}")
                    else:
                        other_docs.append(doc)
                        print(f"  📄 {filename} - {chunks} 个知识块")
                
                print(f"\n📊 统计结果:")
                print(f"  • 重点政策文档: {len(priority_docs)} 个")
                print(f"  • 其他文档: {len(other_docs)} 个")
                print(f"  • 总文档数: {len(documents)} 个")
                
                expected_priority_docs = 7
                if len(priority_docs) == expected_priority_docs:
                    print(f"✅ 重点政策文档已全部自动添加！({len(priority_docs)}/{expected_priority_docs})")
                    return True
                else:
                    print(f"⚠️ 重点政策文档未完全添加: {len(priority_docs)}/{expected_priority_docs}")
                    return False
                    
            else:
                print(f"❌ 获取文档列表失败: {result.get('message', '未知错误')}")
                return False
        else:
            print(f"❌ 获取文档列表失败: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ 检查文档异常: {e}")
        return False

def main():
    print("🧪 测试新课程自动添加重点政策文档功能")
    print("=" * 60)
    
    # 等待服务器启动
    if not wait_for_server(max_wait=120):
        print("❌ 服务器启动超时")
        return
    
    # 创建session并登录
    session = requests.Session()
    if not login_as_teacher(session):
        print("❌ 教师登录失败")
        return
    
    # 创建测试课程
    print("\n📚 创建测试课程...")
    course = create_test_course(session)
    if not course:
        print("❌ 创建测试课程失败")
        return
    
    # 等待几秒让系统处理文档
    print("\n⏳ 等待系统自动处理重点政策文档...")
    time.sleep(10)
    
    # 检查课程的知识库文档
    print("\n🔍 检查课程知识库文档...")
    success = check_course_documents(session, course['id'])
    
    if success:
        print("\n🎉 测试成功！新课程自动添加重点政策文档功能正常工作！")
        print("\n💡 功能特点:")
        print("  • 创建新课程时自动添加7个重点政策文档")
        print("  • 包含GB/T和GB/Z系列教育信息化标准")
        print("  • 自动进行PDF文本提取和向量化处理")
        print("  • 支持RAG系统智能检索")
        print("  • 所有课程都具有相同的政策知识基础")
    else:
        print("\n😞 测试失败，功能可能需要调整")
        print("请检查:")
        print("  • 服务器日志是否有错误信息")
        print("  • 重点政策文档文件是否存在")
        print("  • PriorityPolicyService是否正确注入")

if __name__ == "__main__":
    main() 