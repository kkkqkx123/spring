package com.example.demo.controller;

import com.example.demo.exception.EmailSendingException;
import com.example.demo.model.dto.BulkEmailRequest;
import com.example.demo.model.dto.EmailRequest;
import com.example.demo.model.dto.EmailResponse;
import com.example.demo.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for sending emails to employees.
 */
@RestController
@RequestMapping("/emails")
@RequiredArgsConstructor
@Slf4j
public class EmailController {

    private final EmailService emailService;

    /**
     * Sends an email to a single employee using a template.
     *
     * @param request Email request containing recipient, subject, template, and variables
     * @return Response entity with success message
     */
    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<EmailResponse> sendEmail(@Valid @RequestBody EmailRequest request) {
        log.info("Sending email to: {}", request.getTo());
        try {
            emailService.sendTemplatedEmail(
                    request.getTo(),
                    request.getSubject(),
                    request.getTemplate(),
                    request.getVariables()
            );
            return ResponseEntity.ok(new EmailResponse("Email sent successfully"));
        } catch (EmailSendingException e) {
            log.error("Failed to send email: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new EmailResponse("Failed to send email: " + e.getMessage()));
        }
    }

    /**
     * Sends emails to multiple employees using a template.
     *
     * @param request Bulk email request containing recipients, subject, template, and variables
     * @return Response entity with success message
     */
    @PostMapping("/send-bulk")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<EmailResponse> sendBulkEmails(@Valid @RequestBody BulkEmailRequest request) {
        log.info("Sending bulk emails to {} recipients", request.getRecipients().size());
        try {
            emailService.sendBulkEmails(
                    request.getRecipients(),
                    request.getSubject(),
                    request.getTemplate(),
                    request.getVariables()
            );
            return ResponseEntity.ok(new EmailResponse("Bulk emails sent successfully"));
        } catch (EmailSendingException e) {
            log.error("Failed to send bulk emails: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new EmailResponse("Failed to send bulk emails: " + e.getMessage()));
        }
    }

    /**
     * Sends a welcome email to a new employee.
     *
     * @param employeeId ID of the employee to send the welcome email to
     * @return Response entity with success message
     */
    @PostMapping("/welcome/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<EmailResponse> sendWelcomeEmail(@PathVariable Long employeeId) {
        // In a real implementation, this would fetch the employee details from the database
        // and use them to populate the welcome email template
        log.info("Sending welcome email to employee with ID: {}", employeeId);
        return ResponseEntity.ok(new EmailResponse("Welcome email functionality to be implemented"));
    }

    /**
     * Sends a payroll notification email to an employee.
     *
     * @param employeeId ID of the employee to send the payroll notification to
     * @param payrollId  ID of the payroll to include in the notification
     * @return Response entity with success message
     */
    @PostMapping("/payroll-notification/{employeeId}/{payrollId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER')")
    public ResponseEntity<EmailResponse> sendPayrollNotification(
            @PathVariable Long employeeId,
            @PathVariable Long payrollId) {
        // In a real implementation, this would fetch the employee and payroll details
        // from the database and use them to populate the payroll notification template
        log.info("Sending payroll notification to employee with ID: {} for payroll ID: {}", employeeId, payrollId);
        return ResponseEntity.ok(new EmailResponse("Payroll notification functionality to be implemented"));
    }

    /**
     * Sends an announcement email to all employees or employees in a specific department.
     *
     * @param request     Email request containing the announcement details
     * @param departmentId Optional department ID to filter recipients (null for all employees)
     * @return Response entity with success message
     */
    @PostMapping("/announcement")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<EmailResponse> sendAnnouncement(
            @Valid @RequestBody EmailRequest request,
            @RequestParam(required = false) Long departmentId) {
        // In a real implementation, this would fetch all employees or employees in the specified department
        // and send the announcement to them
        log.info("Sending announcement to department ID: {}", departmentId != null ? departmentId : "all departments");
        return ResponseEntity.ok(new EmailResponse("Announcement email functionality to be implemented"));
    }
}