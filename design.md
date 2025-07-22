The following is a summary of project requirements, architectural design, and design specifications based on the contents of the folder:

### Project Requirements
#### Functional Requirements
1. **Permission Management**
- Design a permission database containing resource tables, role tables, user tables, resource role tables, and user role tables.
- Dynamically handle the relationship between roles and resources, and dynamically load modules based on the user's role after login.
    - Manage user-role relationships.
2. **Server Environment**
- Develop the server using SpringBoot + SpringSecurity.
- Implement a unified exception handling mechanism for server-side exceptions.
3. **Frontend Interaction**
- Wrap Axios requests and uniformly handle request exceptions.
    - Save login status and dynamically load components after successful login.
4. **Department Management**
- Design the department database and write stored procedures.
- Implement recursive queries for department data.
- Use a Tree component to display department information.
5. **Position and Title Management**
    - Manage job title and professional title information, display via tables, and support basic CRUD operations.
6. **Employee Management**
    - Manage employee basic information, implement CRUD operations, pagination, batch deletion, basic search, and advanced search functionality.
    - Support Excel import/export of employee information.
7. **Email Functionality**
    - Use Freemarker email templates to generate emails.
    - Implement Java email sending functionality, supporting the use of new threads to send emails in SpringBoot.
8. **Payroll Ledger Management**
- Manage payroll ledgers, supporting the addition of new payroll ledgers.
9. **Employee Ledger Settings**
- Set up employee ledgers, supporting the viewing of ledger details and ledger modifications.
10. **Chat and Notification Functionality**
    - Implement online chat functionality.
- Implement system notification functionality, including notification saving, pushing, and viewing.

#### Non-Functional Requirements
- Provide detailed documentation to help newcomers quickly understand the project.

### Architecture Design
#### Server-Side Architecture
- **Framework**: Developed using SpringBoot + SpringSecurity.
- **Dependencies**: Uses MyBatis for database operations, Druid as the database connection pool, and MySQL as the database.
- **Exception Handling**: Uniformly handles server-side exceptions.

#### Frontend Architecture
- **Framework**: Developed using Vue for the frontend.
- **Request Encapsulation**: Encapsulate axios requests and uniformly handle request exceptions.
- **Component Reusability**: Support component reusability.

### Design Specifications
#### Database Design
- **Permissions Database**: Includes resource tables, role tables, user tables, resource-role tables, and user-role tables.
- **Department Database**: Includes standard fields, uses depPath for convenient querying, and isParent indicates whether it is a parent department.
- **System Notification Database**: The msgcontent table stores system notifications, and the sysmsg table records the relationship between users and notifications.

#### Code Implementation
- **Recursive Query**: Uses the collection feature in MyBatis' ResultMap to implement recursive queries for department data.
- **Tree Control**: Uses ElementUI's tree control to display department information, adopting a one-time loading approach for all data.
- **Email Templates**: Uses Freemarker to create email templates, with template files stored in the ftl directory under the resources directory.

#### Interface Design
- **Role Display**: Uses ElementUI's Collapse panel to display roles, and a tree control to display role resources.
- **Position and Title Management**: Use a table to display position and title information.
- **Employee Management**: Provide an employee basic information management interface, supporting CRUD operations, pagination, batch deletion, and search functionality.
- **Chat and Notifications**: Provide an online chat and system notification interface, supporting message sending and viewing.