<#include "../common/header.ftl">

<h2>${announcementTitle}</h2>

<p>Dear ${employeeName},</p>

<div style="padding: 15px; background-color: #fff; border-left: 4px solid #0056b3; margin-bottom: 20px;">
    ${announcementContent}
</div>

<#if eventDate??>
<p><strong>Date:</strong> ${eventDate}</p>
</#if>

<#if eventLocation??>
<p><strong>Location:</strong> ${eventLocation}</p>
</#if>

<#if additionalInfo??>
<p><strong>Additional Information:</strong></p>
<p>${additionalInfo}</p>
</#if>

<p>Best regards,<br>
${senderName!'Management Team'}</p>

<#include "../common/footer.ftl">