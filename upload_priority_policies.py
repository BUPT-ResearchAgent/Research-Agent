#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
上传"重点"文件夹中的PDF政策文档到SmartEdu知识库的脚本
让所有课程都能访问这些重要的标准文档
"""

import os
import requests
import time
import json
import shutil
from pathlib import Path

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

def login_as_teacher(session, username="teacher1", password="teacher123"):
    """登录教师账户"""
    try:
        login_data = {
            "username": username,
            "password": password,
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
                print(f"✅ 教师登录成功: {username}")
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

def get_courses(session):
    """获取课程列表"""
    try:
        response = session.get(
            'http://localhost:8080/api/teacher/courses',
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success') and result.get('data'):
                courses = result['data']
                print(f"✅ 获取到 {len(courses)} 个课程")
                return courses
            else:
                print(f"❌ 获取课程失败: {result.get('message', '未知错误')}")
                return []
        else:
            print(f"❌ 获取课程失败: HTTP {response.status_code}")
            return []
            
    except Exception as e:
        print(f"❌ 获取课程异常: {e}")
        return []

def copy_file_to_project(source_file, target_dir):
    """复制文件到项目的policy_documents目录"""
    try:
        # 确保目标目录存在
        os.makedirs(target_dir, exist_ok=True)
        
        # 复制文件
        target_file = os.path.join(target_dir, os.path.basename(source_file))
        shutil.copy2(source_file, target_file)
        
        print(f"✅ 文件复制成功: {os.path.basename(source_file)}")
        return target_file
        
    except Exception as e:
        print(f"❌ 文件复制失败: {e}")
        return None

def upload_document_to_course(session, course_id, file_path, description=""):
    """上传文档到指定课程的知识库"""
    try:
        url = "http://localhost:8080/api/teacher/knowledge/upload"
        
        with open(file_path, 'rb') as f:
            files = {
                'file': (os.path.basename(file_path), f, 'application/pdf')
            }
            data = {
                'courseId': course_id,
                'description': description
            }
            
            response = session.post(url, files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    return True, result.get('message', '上传成功')
                else:
                    return False, result.get('message', '未知错误')
            else:
                return False, f"HTTP {response.status_code}: {response.text}"
                
    except Exception as e:
        return False, f"上传异常: {e}"

def get_file_description(filename):
    """根据文件名生成描述"""
    descriptions = {
        "GBT+36437-2018.pdf": "GB/T 36437-2018 智慧校园总体架构标准，规定了智慧校园的系统架构、技术要求和建设规范",
        "GBT+36436-2018.pdf": "GB/T 36436-2018 教育管理信息化标准，规范了教育管理系统的信息化建设要求",
        "GBZ+43946-2024.pdf": "GB/Z 43946-2024 教育数字化转型技术指南，指导教育机构进行数字化改革的技术标准",
        "GBZ+45261-2025.pdf": "GB/Z 45261-2025 人工智能教育应用技术规范，规定了AI在教育领域应用的技术要求和安全标准",
        "GBZ+45262-2025.pdf": "GB/Z 45262-2025 智能教学系统数据安全技术要求，保障教育数据安全的技术标准",
        "人工智能教育应用系列标准.pdf": "人工智能教育应用系列标准文件集，包含AI教育应用的全套标准规范和指导原则",
        "GBT+45654-2025.pdf": "GB/T 45654-2025 教育信息化评估标准，用于评估教育信息化建设水平的技术标准"
    }
    
    return descriptions.get(filename, f"重要的政策标准文档：{filename}")

def main():
    print("🚀 开始上传重点文件夹中的PDF政策文档到SmartEdu知识库")
    print("📋 目标：让所有课程都能访问这些重要的标准文档")
    print("-" * 80)
    
    # 等待服务器启动
    if not wait_for_server("http://localhost:8080", max_wait=120):
        print("❌ 服务器启动超时，请检查应用程序状态")
        return
    
    # 检查重点文件夹
    priority_folder = Path("../重点")
    if not priority_folder.exists():
        print(f"❌ 重点文件夹不存在: {priority_folder.absolute()}")
        return
    
    # 获取PDF文件列表
    pdf_files = list(priority_folder.glob("*.pdf"))
    if not pdf_files:
        print("❌ 重点文件夹中没有找到PDF文件")
        return
    
    print(f"📄 找到 {len(pdf_files)} 个PDF文件:")
    for pdf_file in pdf_files:
        print(f"  • {pdf_file.name} ({pdf_file.stat().st_size / 1024 / 1024:.1f} MB)")
    
    # 创建session并登录
    session = requests.Session()
    if not login_as_teacher(session):
        print("❌ 教师登录失败，无法继续")
        return
    
    # 获取课程列表
    courses = get_courses(session)
    if not courses:
        print("❌ 没有找到课程，无法上传文档")
        return
    
    print(f"\n📚 找到 {len(courses)} 个课程:")
    for course in courses:
        print(f"  • {course['name']} (ID: {course['id']})")
    
    # 复制文件到项目目录
    target_dir = "policy_documents/priority"
    copied_files = []
    
    print(f"\n📁 复制文件到项目目录: {target_dir}")
    for pdf_file in pdf_files:
        target_file = copy_file_to_project(str(pdf_file), target_dir)
        if target_file:
            copied_files.append((target_file, pdf_file.name))
    
    if not copied_files:
        print("❌ 没有文件复制成功，无法继续")
        return
    
    # 上传到所有课程
    print(f"\n📤 开始上传 {len(copied_files)} 个文件到 {len(courses)} 个课程...")
    
    upload_stats = {
        'total_uploads': 0,
        'successful_uploads': 0,
        'failed_uploads': 0,
        'course_stats': {}
    }
    
    for course in courses:
        course_id = course['id']
        course_name = course['name']
        
        print(f"\n📚 正在上传到课程: {course_name} (ID: {course_id})")
        
        course_success = 0
        course_fail = 0
        
        for target_file, original_name in copied_files:
            description = get_file_description(original_name)
            
            print(f"  📄 上传文档: {original_name}")
            upload_stats['total_uploads'] += 1
            
            success, message = upload_document_to_course(session, course_id, target_file, description)
            
            if success:
                print(f"    ✅ 上传成功")
                upload_stats['successful_uploads'] += 1
                course_success += 1
            else:
                print(f"    ❌ 上传失败: {message}")
                upload_stats['failed_uploads'] += 1
                course_fail += 1
            
            # 避免请求过快
            time.sleep(1)
        
        upload_stats['course_stats'][course_name] = {
            'success': course_success,
            'fail': course_fail
        }
    
    # 打印统计结果
    print("\n" + "=" * 80)
    print("📊 上传统计结果")
    print("=" * 80)
    print(f"📋 总上传次数: {upload_stats['total_uploads']}")
    print(f"✅ 成功上传: {upload_stats['successful_uploads']}")
    print(f"❌ 上传失败: {upload_stats['failed_uploads']}")
    print(f"📊 成功率: {upload_stats['successful_uploads']/upload_stats['total_uploads']*100:.1f}%")
    
    print(f"\n📚 各课程上传详情:")
    for course_name, stats in upload_stats['course_stats'].items():
        print(f"  • {course_name}: ✅{stats['success']} ❌{stats['fail']}")
    
    if upload_stats['successful_uploads'] > 0:
        print(f"\n🎉 上传完成！已成功将以下文档添加到知识库:")
        for target_file, original_name in copied_files:
            print(f"  • {original_name}")
            print(f"    {get_file_description(original_name)}")
        
        print(f"\n💡 这些重要的标准文档现在可以在所有课程的RAG系统中被检索到了！")
        print("系统会自动对这些PDF文档进行文本提取和向量化处理，")
        print("以便在回答问题时能够准确检索相关政策和标准内容。")
        
        print(f"\n📝 包含的标准文档类型:")
        print("  • 智慧校园建设标准")
        print("  • 教育信息化规范")
        print("  • 人工智能教育应用标准")
        print("  • 教育数据安全要求")
        print("  • 数字化转型技术指南")
    else:
        print("\n😞 很遗憾，没有文档上传成功。请检查:")
        print("  • 服务器是否正常运行")
        print("  • 教师账户是否有权限")
        print("  • 文件格式是否支持")
        print("  • 网络连接是否正常")

if __name__ == "__main__":
    main() 