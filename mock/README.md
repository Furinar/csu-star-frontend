# Mock 数据目录

该目录用于本地联调与页面演示，按业务模块存放模拟数据。

## 目录结构

- `mock/rankings/resources.mock.json`：资源排行榜 mock（含综合、点赞、下载、热度等字段）
- `mock/rankings/teachers.mock.json`：教师排行榜 mock（已按最新需求去掉资源数维度，保留热度维度）
- `mock/rankings/courses.mock.json`：课程排行榜 mock

## 说明

- `rank_type` 建议与前端页面一致：
  - 资源：`comprehensive` / `downloads` / `likes` / `hot_score` / `created_at` / `semester`
  - 教师：`avg_score` / `avg_quality` / `avg_grading` / `avg_attendance` / `hot_score` / `eval_count`
  - 课程：`avg_score` / `avg_homework` / `avg_gain` / `avg_exam_diff` / `resource_count` / `hot`
