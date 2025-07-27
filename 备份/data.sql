-- 初始化角色数据
INSERT INTO roles (name, description) VALUES ('ROLE_USER', 'Regular User');
INSERT INTO roles (name, description) VALUES ('ROLE_ADMIN', 'System Administrator');
INSERT INTO roles (name, description) VALUES ('ROLE_HR_MANAGER', 'HR Manager');

-- 初始化资源数据（基本权限）
INSERT INTO resources (name, url, method) VALUES ('EMPLOYEE_READ', '/api/employees', 'GET');
INSERT INTO resources (name, url, method) VALUES ('DEPARTMENT_READ', '/api/departments', 'GET');
INSERT INTO resources (name, url, method) VALUES ('POSITION_READ', '/api/positions', 'GET');
INSERT INTO resources (name, url, method) VALUES ('CHAT_READ', '/api/chat', 'GET');
INSERT INTO resources (name, url, method) VALUES ('CHAT_CREATE', '/api/chat', 'POST');
INSERT INTO resources (name, url, method) VALUES ('NOTIFICATION_READ', '/api/notifications', 'GET');

-- 关联USER角色与基本权限
INSERT INTO role_resources (role_id, resource_id) 
SELECT r.id, res.id FROM roles r, resources res 
WHERE r.name = 'ROLE_USER' 
AND res.name IN ('EMPLOYEE_READ', 'DEPARTMENT_READ', 'POSITION_READ', 'CHAT_READ', 'CHAT_CREATE', 'NOTIFICATION_READ');