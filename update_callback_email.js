const fs = require('fs');
let content = fs.readFileSync('src/app/api/callback/route.ts', 'utf8');

const importStatement = 'import { sendAdminNotification } from "@/lib/email";\n';
if (!content.includes('sendAdminNotification')) {
  content = importStatement + content;
}

const newLogic = \
      if (error) {
        console.error('Error updating order:', error);
      } else {
        // Notify Admin of successful payment
        const htmlContent = \\\
          <h2>New Order Paid! ??</h2>
          <p><strong>Order ID:</strong> \</p>
          <p><strong>Customer:</strong> \</p>
          <p><strong>Amount Paid:</strong> ?\</p>
          <p><a href="\/admin/orders/\">Click here to view the order details in the Admin Panel</a></p>
        \\\;
        await sendAdminNotification("?? New Order Received & Paid!", htmlContent);
      }\;

content = content.replace(
  \      if (error) {
        console.error('Error updating order:', error);
      }\,
  newLogic
);

fs.writeFileSync('src/app/api/callback/route.ts', content, 'utf8');
