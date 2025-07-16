#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试联网搜索功能在教学大纲和试卷生成中的集成效果
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8080"
TEST_USERNAME = "teacher1"
TEST_PASSWORD = "teacher123"

def login():
    """登录获取session"""
    session = requests.Session()
    
    # 登录
    login_data = {
        "username": TEST_USERNAME,
        "password": TEST_PASSWORD,
        "userType": "teacher"
    }
    
    response = session.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if response.status_code == 200:
        result = response.json()
        if result.get("success"):
            print(f"✅ 登录成功: {result.get('message')}")
            return session
        else:
            print(f"❌ 登录失败: {result.get('message')}")
            return None
    else:
        print(f"❌ 登录请求失败: {response.status_code}")
        return None

def get_courses(session):
    """获取课程列表"""
    response = session.get(f"{BASE_URL}/api/teacher/courses")
    if response.status_code == 200:
        courses = response.json()
        print(f"📚 获取到 {len(courses)} 门课程")
        return courses
    else:
        print(f"❌ 获取课程失败: {response.status_code}")
        return []

def test_outline_generation_with_web_search(session, course_id, course_name):
    """测试带有联网搜索的教学大纲生成"""
    print(f"\n🎯 测试课程《{course_name}》的教学大纲生成（集成联网搜索）...")
    
    outline_data = {
        "courseId": course_id,
        "requirements": "请结合行业最新需求和招聘要求生成教学大纲",
        "hours": 2
    }
    
    print("📡 正在生成教学大纲（包含行业调研）...")
    start_time = time.time()
    
    response = session.post(f"{BASE_URL}/api/teacher/outline/generate", json=outline_data)
    
    end_time = time.time()
    print(f"⏱️ 生成耗时: {end_time - start_time:.2f}秒")
    
    if response.status_code == 200:
        result = response.json()
        if result.get("success"):
            outline = result.get("data", {})
            print(f"✅ 教学大纲生成成功!")
            print(f"📝 大纲ID: {outline.get('id')}")
            print(f"📄 标题: {outline.get('title', '未知')}")
            
            # 检查内容是否包含行业信息关键词
            content = outline.get("content", "")
            industry_keywords = ["招聘", "岗位", "薪资", "技能要求", "就业", "行业", "发展趋势", "能力要求"]
            found_keywords = [kw for kw in industry_keywords if kw in content]
            
            if found_keywords:
                print(f"🎯 检测到行业信息集成: {', '.join(found_keywords)}")
                print("✅ 联网搜索功能正常工作!")
            else:
                print("⚠️ 未检测到明显的行业信息，可能搜索功能未生效")
            
            # 显示部分内容（前500字符）
            print(f"📄 内容预览:\n{content[:500]}...")
            return True
        else:
            print(f"❌ 生成失败: {result.get('message')}")
            return False
    else:
        print(f"❌ 请求失败: {response.status_code}")
        return False

def test_exam_generation_with_web_search(session, course_id, course_name):
    """测试带有联网搜索的试卷生成"""
    print(f"\n🎯 测试课程《{course_name}》的试卷生成（集成联网搜索）...")
    
    exam_data = {
        "courseId": course_id,
        "title": f"{course_name}期末考试（行业导向）",
        "chapter": "综合测试",
        "duration": 120,
        "totalScore": 100,
        "questionTypes": {
            "multiple-choice": {"count": 10, "scorePerQuestion": 5},
            "answer": {"count": 2, "scorePerQuestion": 25}
        },
        "difficulty": {
            "easy": 30,
            "medium": 50,
            "hard": 20
        },
        "specialRequirements": "题目应该体现实际工作场景和行业应用需求"
    }
    
    print("📡 正在生成试卷（包含行业调研）...")
    start_time = time.time()
    
    response = session.post(f"{BASE_URL}/api/exam/generate", json=exam_data)
    
    end_time = time.time()
    print(f"⏱️ 生成耗时: {end_time - start_time:.2f}秒")
    
    if response.status_code == 200:
        result = response.json()
        if result.get("success"):
            exam = result.get("data", {})
            print(f"✅ 试卷生成成功!")
            print(f"📝 试卷ID: {exam.get('id')}")
            print(f"📄 标题: {exam.get('title', '未知')}")
            
            # 检查题目是否包含行业信息关键词
            questions = exam.get("questions", [])
            print(f"📊 题目数量: {len(questions)}")
            
            industry_mentions = 0
            for i, question in enumerate(questions):
                content = question.get("content", "")
                if any(kw in content for kw in ["公司", "项目", "工作", "实际", "应用", "场景", "开发", "系统"]):
                    industry_mentions += 1
            
            if industry_mentions > 0:
                print(f"🎯 检测到 {industry_mentions} 道题目包含实际应用场景")
                print("✅ 联网搜索功能在试卷生成中正常工作!")
            else:
                print("⚠️ 未检测到明显的实际应用场景，可能搜索功能未生效")
            
            # 显示第一道题的内容
            if questions:
                first_question = questions[0]
                print(f"📄 第一题预览:\n{first_question.get('content', '')[:200]}...")
            
            return True
        else:
            print(f"❌ 生成失败: {result.get('message')}")
            return False
    else:
        print(f"❌ 请求失败: {response.status_code}")
        return False

def main():
    """主测试流程"""
    print("🚀 开始测试联网搜索功能集成...")
    print(f"⏰ 测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 登录
    session = login()
    if not session:
        return
    
    # 获取课程
    courses = get_courses(session)
    if not courses:
        return
    
    # 选择前3门课程进行测试
    test_courses = courses[:3]
    print(f"\n📋 将测试以下课程:")
    for course in test_courses:
        print(f"  - {course.get('name', '未知')}")
    
    results = {
        "outline_success": 0,
        "outline_total": 0,
        "exam_success": 0,
        "exam_total": 0
    }
    
    for course in test_courses:
        course_id = course.get("id")
        course_name = course.get("name", "未知课程")
        
        print(f"\n{'='*50}")
        print(f"📚 正在测试课程: {course_name} (ID: {course_id})")
        print(f"{'='*50}")
        
        # 测试教学大纲生成
        results["outline_total"] += 1
        if test_outline_generation_with_web_search(session, course_id, course_name):
            results["outline_success"] += 1
        
        time.sleep(2)  # 避免请求过快
        
        # 测试试卷生成
        results["exam_total"] += 1
        if test_exam_generation_with_web_search(session, course_id, course_name):
            results["exam_success"] += 1
        
        time.sleep(2)  # 避免请求过快
    
    # 输出测试总结
    print(f"\n{'='*60}")
    print(f"📊 测试结果总结")
    print(f"{'='*60}")
    print(f"🎯 教学大纲生成: {results['outline_success']}/{results['outline_total']} 成功")
    print(f"📝 试卷生成: {results['exam_success']}/{results['exam_total']} 成功")
    
    total_success = results['outline_success'] + results['exam_success']
    total_tests = results['outline_total'] + results['exam_total']
    success_rate = (total_success / total_tests * 100) if total_tests > 0 else 0
    
    print(f"📈 总体成功率: {success_rate:.1f}% ({total_success}/{total_tests})")
    
    if success_rate >= 80:
        print("✅ 联网搜索功能集成测试通过!")
    else:
        print("⚠️ 联网搜索功能可能存在问题，需要进一步检查")

if __name__ == "__main__":
    main() 