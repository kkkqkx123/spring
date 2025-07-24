<#include "../common/header.ftl">

<h2>Password Reset Request</h2>

<p>Dear ${employeeName},</p>

<p>We received a request to reset your password for the Employee Management System.</p>

<p>To reset your password, please click the link below:</p>

<p><a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #0056b3; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a></p>

<p>If you did not request a password reset, please ignore this email or contact IT support.</p>

<p>This link will expire in 24 hours.</p>

<p>Best regards,<br>
IT Support Team</p>

<#include "../common/footer.ftl">