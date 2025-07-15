#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
上传政策文档到SmartEdu知识库的脚本
"""

import os
import requests
import time
import json

def wait_for_server(url, max_wait=60):
    """等待服务器启动"""
    print(f"等待服务器启动: {url}")
    for i in range(max_wait):
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print("✅ 服务器已启动")
                return True
        except requests.exceptions.RequestException:
            pass
        print(f"等待中... ({i+1}/{max_wait})")
        time.sleep(1)
    return False

def get_courses():
    """获取课程列表"""
    try:
        # 模拟登录状态 - 在实际环境中需要正确的session
        session = requests.Session()
        
        # 先尝试获取一个简单的课程列表
        response = session.get('http://localhost:8080/api/teacher/knowledge/courses', 
                             headers={'Content-Type': 'application/json'})
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"获取课程列表失败: {response.status_code}")
            print(f"响应内容: {response.text}")
            return None
    except Exception as e:
        print(f"获取课程列表异常: {e}")
        return None

def upload_document(course_id, file_path, description=""):
    """上传文档到知识库"""
    try:
        url = "http://localhost:8080/api/teacher/knowledge/upload"
        
        with open(file_path, 'rb') as f:
            files = {
                'file': (os.path.basename(file_path), f, 'text/plain')
            }
            data = {
                'courseId': course_id,
                'description': description
            }
            
            session = requests.Session()
            response = session.post(url, files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    print(f"✅ 上传成功: {os.path.basename(file_path)}")
                    return True
                else:
                    print(f"❌ 上传失败: {result.get('message', '未知错误')}")
                    return False
            else:
                print(f"❌ 上传失败: HTTP {response.status_code}")
                print(f"响应内容: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ 上传异常: {e}")
        return False

def create_course_for_policies():
    """创建一个专门的政策课程"""
    try:
        url = "http://localhost:8080/api/teacher/courses"
        course_data = {
            "name": "国家教育政策与法规",
            "description": "国家教育政策、教育部文件、领导人重要讲话等政策文档集合",
            "credit": 2,
            "hours": 32,
            "semester": "2024-1",
            "academicYear": "2024",
            "classTime": "周三下午",
            "classLocation": "政策学习中心",
            "maxStudents": 1000,
            "teacherId": 1  # 假设教师ID为1
        }
        
        session = requests.Session()
        response = session.post(url, json=course_data, headers={'Content-Type': 'application/json'})
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success') and result.get('data'):
                course_id = result['data']['id']
                print(f"✅ 创建政策课程成功，ID: {course_id}")
                return course_id
            else:
                print(f"❌ 创建课程失败: {result.get('message', '未知错误')}")
                return None
        else:
            print(f"❌ 创建课程失败: HTTP {response.status_code}")
            print(f"响应内容: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ 创建课程异常: {e}")
        return None

def main():
    print("🚀 开始上传政策文档到SmartEdu知识库")
    
    # 等待服务器启动
    if not wait_for_server("http://localhost:8080", max_wait=120):
        print("❌ 服务器启动超时，请检查应用程序状态")
        return
    
    # 政策文档列表
    policy_documents = [
        {
            "file": "policy_documents/教育部关于人工智能教育指导意见.txt",
            "description": "教育部关于推进人工智能教育发展的指导意见，包含AI教育的总体要求、主要目标和重点任务"
        },
        {
            "file": "policy_documents/国家智慧教育平台建设方案.txt", 
            "description": "国家智慧教育平台建设与应用方案，涵盖平台建设目标、技术保障和应用推广"
        },
        {
            "file": "policy_documents/习近平总书记关于教育数字化重要讲话.txt",
            "description": "习近平总书记在全国教育数字化工作会议上的重要讲话，阐述了教育数字化的重大意义和基本要求"
        },
        {
            "file": "policy_documents/新时代教育评价改革总体方案.txt",
            "description": "中共中央国务院印发的新时代教育评价改革总体方案，破除唯分数、唯升学、唯文凭、唯论文、唯帽子的顽瘴痼疾"
        },
        {
            "file": "policy_documents/数字中国建设整体布局规划.txt",
            "description": "数字中国建设整体布局规划(2023-2035年)，统筹推进数字中国建设的重要文件"
        }
    ]
    
    # 检查文档是否存在
    for doc in policy_documents:
        if not os.path.exists(doc["file"]):
            print(f"❌ 文档不存在: {doc['file']}")
            return
    
    # 尝试获取现有课程或创建新课程
    courses = get_courses()
    course_id = None
    
    if courses and courses.get('success') and courses.get('data'):
        # 使用第一个课程
        course_list = courses['data']
        if course_list:
            course_id = course_list[0]['id']
            print(f"📚 使用现有课程: {course_list[0]['name']} (ID: {course_id})")
        else:
            print("📚 没有现有课程，尝试创建新课程...")
            course_id = create_course_for_policies()
    else:
        print("📚 无法获取课程列表，尝试创建新课程...")
        course_id = create_course_for_policies()
    
    if not course_id:
        print("❌ 无法获取或创建课程，无法继续上传")
        return
    
    # 上传所有政策文档
    success_count = 0
    for doc in policy_documents:
        print(f"\n📄 上传文档: {os.path.basename(doc['file'])}")
        if upload_document(course_id, doc["file"], doc["description"]):
            success_count += 1
        time.sleep(2)  # 避免请求过快
    
    print(f"\n🎉 上传完成！成功上传 {success_count}/{len(policy_documents)} 个文档")
    
    if success_count > 0:
        print("\n📝 已上传的政策文档包括：")
        for doc in policy_documents:
            print(f"  • {os.path.basename(doc['file'])}")
        
        print(f"\n💡 这些政策文档现在可以在RAG系统中被检索到了！")
        print("系统会自动对这些文档进行向量化处理，以便在回答问题时能够准确检索相关政策内容。")

if __name__ == "__main__":
    main() 