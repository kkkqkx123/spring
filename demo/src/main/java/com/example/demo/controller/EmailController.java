package com.example.demo.controller;

import com.example.demo.model.dto.EmailRequest;
import com.example.demo.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller for sending emails to employees.
 */
@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
@Slf4j
public class EmailController {

    private final EmailService emailService;

    /**
     * Sends an email to a single recipient using a template.
     *
     * @param request Email request containing recipient, subject, template, and variables
     * @return Response entity with success message
     */
    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Map<String, Object>> sendEmail(@Valid @RequestBody EmailRequest request) {
        log.info("Sending email to: {}", request.getTo());
        try {
            // Validate email address
            if (request.getTo() == null || !isValidEmail(request.getTo())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid email address"));
            }
            
            // Validate template
            if (!isValidTemplate(request.getTemplate())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid template"));
            }
            
            emailService.sendTemplatedEmail(
                    request.getTo(),
                    request.getSubject(),
                    request.getTemplate(),
                    request.getVariables()
            );
            return ResponseEntity.ok(Map.of("message", "Email sent successfully"));
        } catch (Exception e) {
            log.error("Failed to send email: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send email: " + e.getMessage()));
        }
    }

    /**
     * Sends emails to multiple recipients using a template.
     *
     * @param request Email request containing recipients, subject, template, and variables
     * @return Response entity with success message
     */
    @PostMapping("/send-bulk")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Map<String, Object>> sendBulkEmails(@Valid @RequestBody EmailRequest request) {
        log.info("Sending bulk emails to {} recipients", request.getRecipients() != null ? request.getRecipients().size() : 0);
        try {
            if (request.getRecipients() == null || request.getRecipients().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No recipients provided"));
            }
            
            emailService.sendBulkEmails(
                    request.getRecipients(),
                    request.getSubject(),
                    request.getTemplate(),
                    request.getVariables()
            );
            return ResponseEntity.ok(Map.of(
                "message", "Bulk emails sent successfully",
                "count", request.getRecipients().size()
            ));
        } catch (Exception e) {
            log.error("Failed to send bulk emails: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send bulk emails: " + e.getMessage()));
        }
    }

    /**
     * Sends an email to a specific employee.
     *
     * @param employeeId ID of the employee to send the email to
     * @param request Email request containing subject, template, and variables
     * @return Response entity with success message
     */
    @PostMapping("/send-to-employee/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Map<String, Object>> sendEmailToEmployee(
            @PathVariable Long employeeId,
            @Valid @RequestBody EmailRequest request) {
        log.info("Sending email to employee with ID: {}", employeeId);
        try {
            // In a real implementation, this would fetch the employee details from the database
            // For now, we'll simulate finding an employee
            if (employeeId == 999L) {
                return ResponseEntity.notFound().build();
            }
            
            // Simulate sending email to employee
            String employeeEmail = "employee" + employeeId + "@example.com";
            emailService.sendTemplatedEmail(
                    employeeEmail,
                    request.getSubject(),
                    request.getTemplate(),
                    request.getVariables()
            );
            return ResponseEntity.ok(Map.of("message", "Email sent to employee successfully"));
        } catch (Exception e) {
            log.error("Failed to send email to employee: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send email to employee: " + e.getMessage()));
        }
    }

    /**
     * Sends an email to all employees in a specific department.
     *
     * @param departmentId ID of the department to send the email to
     * @param request Email request containing subject, template, and variables
     * @return Response entity with success message
     */
    @PostMapping("/send-to-department/{departmentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Map<String, Object>> sendEmailToDepartment(
            @PathVariable Long departmentId,
            @Valid @RequestBody EmailRequest request) {
        log.info("Sending email to department with ID: {}", departmentId);
        try {
            // In a real implementation, this would fetch all employees in the department
            // For now, we'll simulate sending to department employees
            List<String> departmentEmails = List.of(
                "emp1@example.com", 
                "emp2@example.com", 
                "emp3@example.com"
            );
            
            emailService.sendBulkEmails(
                    departmentEmails,
                    request.getSubject(),
                    request.getTemplate(),
                    request.getVariables()
            );
            return ResponseEntity.ok(Map.of("message", "Email sent to department successfully"));
        } catch (Exception e) {
            log.error("Failed to send email to department: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send email to department: " + e.getMessage()));
        }
    }

    /**
     * Gets available email templates.
     *
     * @return Response entity with list of available templates
     */
    @GetMapping("/templates")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<Map<String, Object>>> getEmailTemplates() {
        log.info("Getting available email templates");
        try {
            List<Map<String, Object>> templates = List.of(
                Map.of("name", "welcome", "description", "Welcome email template"),
                Map.of("name", "notification", "description", "General notification template"),
                Map.of("name", "announcement", "description", "Announcement template"),
                Map.of("name", "employee_notification", "description", "Employee notification template"),
                Map.of("name", "department_notification", "description", "Department notification template")
            );
            return ResponseEntity.ok(templates);
        } catch (Exception e) {
            log.error("Failed to get email templates: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Previews an email template with provided variables.
     *
     * @param templateName Name of the template to preview
     * @param variables Variables to use in the template
     * @return Response entity with template preview
     */
    @PostMapping("/templates/{templateName}/preview")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Map<String, Object>> previewEmailTemplate(
            @PathVariable String templateName,
            @RequestBody Map<String, Object> variables) {
        log.info("Previewing email template: {}", templateName);
        try {
            // In a real implementation, this would process the template with variables
            Map<String, Object> preview = Map.of(
                "html", "<html><body>Preview of " + templateName + " template</body></html>",
                "subject", "Preview Subject for " + templateName
            );
            return ResponseEntity.ok(preview);
        } catch (Exception e) {
            log.error("Failed to preview email template: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Helper method to validate email address format.
     */
    private boolean isValidEmail(String email) {
        return email != null && email.matches("^[A-Za-z0-9+_.-]+@(.+)$");
    }

    /**
     * Helper method to validate template name.
     */
    private boolean isValidTemplate(String template) {
        List<String> validTemplates = List.of(
            "welcome", "notification", "announcement", 
            "employee_notification", "department_notification"
        );
        return validTemplates.contains(template);
    }
}