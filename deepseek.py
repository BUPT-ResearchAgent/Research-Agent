import requests
import json
import re
from urllib.parse import urlparse
import time

class DeepSeekAPIClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.deepseek.com/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def call_api(self, prompt, model="deepseek-chat", temperature=0.7):
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": 2000
        }
        
        try:
            response = requests.post(self.base_url, headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()['choices'][0]['message']['content']
        except Exception as e:
            print(f"API调用错误: {e}")
            return None

def check_link_availability(url, timeout=5):
    """检查链接是否可访问，过滤404等错误"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.head(url, headers=headers, timeout=timeout, allow_redirects=True)
        
        # 检查状态码
        if response.status_code == 200:
            return True, response.status_code
        else:
            return False, response.status_code
            
    except requests.exceptions.RequestException as e:
        return False, f"请求异常: {e}"
    except Exception as e:
        return False, f"其他错误: {e}"

def extract_references(response_text):
    """从API响应中提取参考文献链接"""
    patterns = [
        r'https?://[^\s\)\]"]+',  # 普通URL
        r'\[(\d+)\]:\s*(https?://[^\s]+)',  # 标记式引用
        r'参考(文献|资料)[：:]\s*(https?://[^\s]+)',  # 中文参考文献格式
        r'来源[：:]\s*(https?://[^\s]+)',  # 来源格式
        r'链接[：:]\s*(https?://[^\s]+)'  # 链接格式
    ]
    
    links = []
    for pattern in patterns:
        matches = re.findall(pattern, response_text)
        for match in matches:
            if isinstance(match, tuple):
                links.append(match[1])
            else:
                links.append(match)
    
    return list(set(links))  # 去重

def filter_unreliable_sources(links):
    """过滤不可信来源和无效链接"""
    unreliable_domains = [
        'hupu.com', 'hupu.cn',  # 虎扑
        '163.com', '3g.163.com', 'mobile.163.com',  # 网易手机新闻
        'sohu.com',  # 搜狐
        'sina.com', 'sina.cn',  # 新浪
        'qq.com',    # 腾讯
        'ifeng.com',  # 凤凰
        'weibo.com',  # 微博
        'tieba.baidu.com',  # 贴吧
        'douban.com'  # 豆瓣
    ]
    
    reliable_links = []
    unavailable_links = []
    
    print("\n开始检查链接可用性...")
    
    for i, link in enumerate(links, 1):
        print(f"检查链接 {i}/{len(links)}: {link[:60]}...")
        
        # 检查域名可信度
        domain = urlparse(link).netloc.lower()
        if any(unreliable_domain in domain for unreliable_domain in unreliable_domains):
            print(f"  → 过滤不可信平台: {domain}")
            continue
        
        # 检查链接可用性
        is_available, status = check_link_availability(link)
        
        if is_available:
            reliable_links.append(link)
            print(f"  ✓ 链接可用 (状态码: {status})")
        else:
            unavailable_links.append((link, status))
            print(f"  ✗ 链接不可用: {status}")
        
        # 添加短暂延迟，避免请求过于频繁
        time.sleep(0.5)
    
    return reliable_links, unavailable_links

def generate_review_prompt(reliable_links, unavailable_links):
    """生成审查提示词"""
    prompt = """我想根据这些链接的发布人、发布平台、发布题目和内容对这些内容进行审查：
    
{reliable_links}

请分析每个链接的：
1. 发布人/机构背景和专业性
2. 发布平台的权威性和专业性  
3. 文章题目的相关性和专业性
4. 内容质量、深度和可信度

请特别过滤掉来自娱乐性、非专业平台的内容，只保留来自网络安全专业机构、标准组织、学术研究或知名技术媒体的高质量内容。

对每个链接进行评级（A:优秀, B:良好, C:一般, D:不可靠），并最终提供经过筛选的可靠资源列表和分析报告。

{unavailable_info}
""".format(
    reliable_links="\n".join([f"- {link}" for link in reliable_links]),
    unavailable_info=f"\n注意：发现 {len(unavailable_links)} 个不可用链接已被过滤。" if unavailable_links else ""
)
    
    return prompt

def main():
    # 替换为您的DeepSeek API密钥
    API_KEY = "***"
    client = DeepSeekAPIClient(API_KEY)
    
    # 第一阶段：搜索STIX Course of Action信息
    print("=== 第一阶段：搜索STIX Course of Action信息 ===")
    search_prompt = """请搜索关于STIX Course of Action的详细信息，包括其概念、应用场景、实施方法和相关标准。请提供权威来源的参考资料，并将所有引用的链接以规范的参考文献格式列出。"""
    
    search_response = client.call_api(search_prompt)
    
    if not search_response:
        print("第一阶段搜索失败")
        return
    
    print("搜索响应摘要:")
    print(search_response[:500] + "..." if len(search_response) > 500 else search_response)
    print("\n" + "="*50)
    
    # 提取链接
    links = extract_references(search_response)
    print(f"\n提取到的 {len(links)} 个链接:")
    for i, link in enumerate(links, 1):
        print(f"{i}. {link}")
    
    # 过滤不可信来源和无效链接
    reliable_links, unavailable_links = filter_unreliable_sources(links)
    
    print(f"\n过滤结果:")
    print(f"总链接数: {len(links)}")
    print(f"可靠链接: {len(reliable_links)}")
    print(f"不可用链接: {len(unavailable_links)}")
    print(f"因平台不可信过滤: {len(links) - len(reliable_links) - len(unavailable_links)}")
    
    if unavailable_links:
        print(f"\n不可用链接详情:")
        for link, status in unavailable_links:
            print(f"  - {link} → {status}")
    
    if reliable_links:
        # 第二阶段：内容审查和分析
        print("\n=== 第二阶段：内容审查和分析 ===")
        review_prompt = generate_review_prompt(reliable_links, unavailable_links)
        
        review_response = client.call_api(review_prompt)
        print("审查结果:")
        print(review_response)
        
        # 保存结果到文件
        with open("stix_analysis_report.txt", "w", encoding="utf-8") as f:
            f.write("STIX Course of Action 分析报告\n")
            f.write("=" * 50 + "\n\n")
            f.write("初始搜索响应:\n")
            f.write(search_response + "\n\n")
            f.write("最终审查结果:\n")
            f.write(review_response + "\n\n")
            f.write("使用的可靠链接:\n")
            for link in reliable_links:
                f.write(f"- {link}\n")
        
        print(f"\n报告已保存到 stix_analysis_report.txt")
    else:
        print("没有找到可靠的链接资源")

if __name__ == "__main__":
    main()