<#include "../common/header.ftl">

<h2>Payroll Notification</h2>

<p>Dear ${employeeName},</p>

<p>Your payroll for the period ${payPeriod} has been processed.</p>

<p>Details:</p>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr style="background-color: #f2f2f2;">
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Description</th>
        <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Amount</th>
    </tr>
    <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">Base Salary</td>
        <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${baseSalary}</td>
    </tr>
    <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">Allowances</td>
        <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${allowances}</td>
    </tr>
    <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">Deductions</td>
        <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${deductions}</td>
    </tr>
    <tr style="font-weight: bold;">
        <td style="padding: 10px; border: 1px solid #ddd;">Net Salary</td>
        <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${netSalary}</td>
    </tr>
</table>

<p>The amount has been transferred to your registered bank account.</p>

<p>If you have any questions regarding your payroll, please contact the Finance department.</p>

<p>Best regards,<br>
Finance Team</p>

<#include "../common/footer.ftl">