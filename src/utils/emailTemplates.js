const dealerApprovedEmail = (name) => {

return `
<h2>Dealer Account Approved 🎉</h2>

<p>Dear ${name},</p>

<p>
Congratulations! Your dealer account has been successfully approved by our team.
You can now log in and start listing your vehicles on our platform.
</p>

<p>
We are excited to have you as part of our dealer network.
</p>

<p>
Best regards,<br>
Rigvay Team
</p>
`;

};

const carApprovedEmail = (name, carUrl) => {

return `
<h2>Your Car Listing is Live 🚗</h2>

<p>Dear ${name},</p>

<p>
Great news! Your car listing has been approved and is now live on our platform.
Customers can now view your vehicle.
</p>

<p>
Click the link below to view your car listing:
</p>

<p>
<a href="${carUrl}" 
style="background:#007bff;color:white;padding:10px 15px;text-decoration:none;border-radius:5px;">
View Car Listing
</a>
</p>

<p>
Thank you for choosing Rigvay.
</p>

<p>
Best regards,<br>
Rigvay Team
</p>
`;

};

module.exports = {
  dealerApprovedEmail,
  carApprovedEmail
};