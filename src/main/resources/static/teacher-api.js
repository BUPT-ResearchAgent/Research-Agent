// SmartEdu教师端API调用模块
const API_BASE_URL = 'http://localhost:8080';

class TeacherAPI {
    // 通用请求方法 - 依赖服务器session，不需要手动传递用户ID
    static async request(url, options = {}) {
        try {
            console.log(`发起API请求: ${url}`, options);
            
            const response = await fetch(`${API_BASE_URL}${url}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                credentials: 'include', // 重要：包含cookie以维持session
                ...options
            });
            
            console.log(`API响应状态: ${response.status}`, response);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP错误 ${response.status}:`, errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            
            const result = await response.json();
            console.log(`API响应数据:`, result);
            return result;
        } catch (error) {
            console.error('API请求失败:', url, error);
            throw error;
        }
    }

    // 获取课程列表
    static async getCourses() {
        return this.request('/api/teacher/courses');
    }

    // 新建课程
    static async createCourse(courseData) {
        return this.request('/api/teacher/courses', {
            method: 'POST',
            body: JSON.stringify(courseData)
        });
    }

    // 更新课程
    static async updateCourse(courseId, courseData) {
        return this.request(`/api/teacher/courses/${courseId}`, {
            method: 'PUT',
            body: JSON.stringify(courseData)
        });
    }

    // 删除课程
    static async deleteCourse(courseId) {
        try {
            console.log(`准备删除课程ID: ${courseId}`);
            const result = await this.request(`/api/teacher/courses/${courseId}`, {
                method: 'DELETE'
            });
            console.log('删除课程API调用结果:', result);
            return result;
        } catch (error) {
            console.error('删除课程API调用失败:', error);
            throw error;
        }
    }

    // 获取控制面板统计数据
    static async getDashboardStats() {
        return this.request('/api/teacher/dashboard/stats');
    }

    // 获取知识点掌握情况
    static async getKnowledgeMastery(courseId) {
        return this.request(`/api/teacher/knowledge-mastery/${courseId}`);
    }

    // 获取课程学生列表
    static async getCourseStudents(courseId) {
        return this.request(`/api/teacher/courses/${courseId}/students`);
    }

    // 获取学生学习进度
    static async getStudentProgress(studentId, courseId = null) {
        const params = courseId ? `?courseId=${courseId}` : '';
        return this.request(`/api/teacher/students/${studentId}/progress${params}`);
    }

    // 获取通知列表
    static async getNotices() {
        return this.request('/api/teacher/notices');
    }

    // 上传文件
    static async uploadFile(formData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/teacher/materials/upload`, {
                method: 'POST',
                credentials: 'include', // 包含cookie以维持session
                body: formData,
                // 不设置Content-Type，让浏览器自动设置multipart/form-data
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('文件上传失败:', error);
            throw error;
        }
    }

    // 生成教学大纲
    static async generateOutline(data) {
        return this.request('/api/teacher/outline/generate', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // 重新生成教学大纲（更新现有大纲）
    static async regenerateOutline(data) {
        return this.request('/api/teacher/outline/regenerate', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // 发布通知
    static async publishNotice(noticeData) {
        return this.request('/api/teacher/notices', {
            method: 'POST',
            body: JSON.stringify(noticeData)
        });
    }

    // 生成试卷
    static async generateExam(examData) {
        return this.request('/api/exam/generate', {
            method: 'POST',
            body: JSON.stringify(examData)
        });
    }

    // 更新试卷
    static async updateExam(examId, content) {
        return this.request(`/api/exam/${examId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: content
        });
    }

    // 获取试卷列表
    static async getExams() {
        return this.request('/api/exam/list');
    }

    // 发布试卷
    static async publishExam(examId, publishData) {
        // 如果有时间设置，使用带时间的发布接口
        if (publishData && (publishData.startTime !== undefined)) {
            return this.request(`/api/exam/${examId}/publish-with-time`, {
            method: 'POST',
            body: JSON.stringify(publishData)
        });
        } else {
            // 否则使用普通发布接口
            return this.request(`/api/exam/${examId}/publish`, {
                method: 'POST',
                body: JSON.stringify(publishData || {})
            });
        }
    }

    // 获取答案列表
    static async getAnswers() {
        return this.request('/api/exam/answers');
    }

    // 更新答案设置
    static async updateAnswerSettings(examId, settings) {
        return this.request(`/api/exam/${examId}/answer-settings`, {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }

    // 获取待批改试卷
    static async getGradeList() {
        return this.request('/api/teacher/grades');
    }

    // AI自动批改
    static async autoGrade(resultId) {
        return this.request(`/api/teacher/grades/${resultId}/auto-grade`, {
            method: 'POST'
        });
    }

    // 手动评分
    static async manualGrade(resultId, gradeData) {
        return this.request(`/api/teacher/grades/${resultId}/manual-grade`, {
            method: 'POST',
            body: JSON.stringify(gradeData)
        });
    }

    // 获取成绩分析数据
    static async getGradeAnalysis(examId) {
        return this.request(`/api/teacher/analysis/${examId}`);
    }

    // 生成教学改进建议
    static async generateImprovements(scope, courseId = null) {
        return this.request('/api/teacher/improvements', {
            method: 'POST',
            body: JSON.stringify({ scope, courseId })
        });
    }

    // 获取课程资料列表
    static async getMaterials(courseId = null) {
        const url = courseId ? `/api/teacher/materials?courseId=${courseId}` : '/api/teacher/materials';
        return this.request(url);
    }

    // 删除课程资料
    static async deleteMaterial(materialId) {
        return this.request(`/api/teacher/materials/${materialId}`, {
            method: 'DELETE'
        });
    }

    // 获取教学大纲历史
    static async getOutlineHistory(courseId = null) {
        const url = courseId ? `/api/teacher/outlines?courseId=${courseId}` : '/api/teacher/outlines';
        return this.request(url);
    }

    // 删除教学大纲
    static async deleteOutline(outlineId) {
        return this.request(`/api/teacher/outlines/${outlineId}`, {
            method: 'DELETE'
        });
    }

    // 注销账户
    static async deleteAccount(password) {
        return this.request('/api/teacher/delete-account', {
            method: 'DELETE',
            body: JSON.stringify({ password })
        });
    }



    // 删除通知
    static async deleteNotice(noticeId) {
        return this.request(`/api/teacher/notices/${noticeId}`, {
            method: 'DELETE'
        });
    }

    // 获取试卷详情
    static async getExamDetail(examId) {
        return this.request(`/api/exam/${examId}`);
    }

    // 删除试卷
    static async deleteExam(examId) {
        return this.request(`/api/exam/${examId}`, {
            method: 'DELETE'
        });
    }

    // 获取成绩详情
    static async getGradeDetail(resultId) {
        return this.request(`/api/teacher/grades/${resultId}`);
    }

    // 批量自动批改
    static async batchAutoGrade(examId) {
        return this.request(`/api/teacher/grades/batch-auto-grade`, {
            method: 'POST',
            body: JSON.stringify({ examId })
        });
    }

    // 发布/取消发布成绩
    static async publishGrades(examId, isPublished) {
        return this.request('/api/teacher/grades/publish', {
            method: 'POST',
            body: JSON.stringify({ examId, isPublished })
        });
    }

    // 导出分析报告
    static async exportAnalysisReport(examId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/teacher/analysis/${examId}/export`, {
                method: 'GET'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // 处理文件下载
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analysis_report_${examId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            return { success: true, message: '报告导出成功' };
        } catch (error) {
            console.error('导出报告失败:', error);
            throw error;
        }
    }

    // 定时发布试卷
    static async scheduleExam(examId, scheduleData) {
        return this.request(`/api/exam/${examId}/schedule`, {
            method: 'POST',
            body: JSON.stringify(scheduleData)
        });
    }

    // 获取考试统计数据
    static async getExamStats(teacherId) {
        return this.request(`/api/exam/stats?teacherId=${teacherId}`);
    }

    // 获取试卷列表
    static async getExamList(teacherId, status = '', search = '') {
        let url = `/api/exam/list?teacherId=${teacherId}`;
        if (status) {
            url += `&status=${encodeURIComponent(status)}`;
        }
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }
        return this.request(url);
    }
    
    // 保存大作业要求
    static async saveAssignmentRequirement(questionId, data) {
        return this.request(`/api/teacher/assignment/requirement/${questionId}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

// 显示消息提示
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        z-index: 1000;
        font-size: 14px;
        background-color: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
}

// 测试API连接
async function testAPI() {
    try {
        const response = await TeacherAPI.getCourses();
        console.log('API测试成功:', response);
        showMessage('API连接成功', 'success');
    } catch (error) {
        console.error('API测试失败:', error);
        showMessage('API连接失败', 'error');
    }
} 