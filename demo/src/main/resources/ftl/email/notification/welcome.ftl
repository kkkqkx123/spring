<#include "../common/header.ftl">

<h2>Welcome to ${companyName!'Our Company'}</h2>

<p>Dear ${employeeName},</p>

<p>Welcome to our team! We're excited to have you join us.</p>

<p>Your account has been created with the following details:</p>

<ul>
    <li><strong>Username:</strong> ${username}</li>
    <li><strong>Email:</strong> ${email}</li>
    <li><strong>Department:</strong> ${department}</li>
    <li><strong>Position:</strong> ${position}</li>
</ul>

<p>Please log in to the Employee Management System to complete your profile and set up your password.</p>

<p>If you have any questions, please contact HR at ${hrEmail!'hr@example.com'}.</p>

<p>Best regards,<br>
HR Team</p>

<#include "../common/footer.ftl">