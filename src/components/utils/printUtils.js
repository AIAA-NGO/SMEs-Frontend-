export const printReceipt = async (sale) => {
    const printWindow = window.open('', '_blank');
    
    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; width: 80mm; margin: 0; padding: 10px; }
          .header { text-align: center; margin-bottom: 10px; }
          .title { font-size: 18px; font-weight: bold; }
          .info { font-size: 12px; margin-bottom: 15px; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .footer { margin-top: 15px; text-align: center; font-size: 12px; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">INVENTORY STORE</div>
          <div class="info">Date: ${new Date(sale.createdAt).toLocaleString()}</div>
          <div class="info">Receipt #: ${sale.id}</div>
        </div>
        
        <div class="divider"></div>
        
        ${sale.items.map(item => `
          <div class="item-row">
            <span>${item.productName} x ${item.quantity}</span>
            <span>Ksh ${(item.unitPrice * item.quantity).toFixed(2)}</span>
          </div>
        `).join('')}
        
        <div class="divider"></div>
        
        <div class="item-row">
          <span>Subtotal:</span>
          <span>Ksh ${sale.subtotal.toFixed(2)}</span>
        </div>
        <div class="item-row">
          <span>Discount:</span>
          <span>- Ksh ${sale.discountAmount.toFixed(2)}</span>
        </div>
        <div class="item-row">
          <span>Tax (16%):</span>
          <span>Ksh ${sale.taxAmount.toFixed(2)}</span>
        </div>
        <div class="item-row bold">
          <span>Total:</span>
          <span>Ksh ${sale.total.toFixed(2)}</span>
        </div>
        <div class="item-row">
          <span>Payment:</span>
          <span>${sale.paymentMethod}</span>
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          Thank you for shopping with us!<br>
          ${sale.customer ? `Customer: ${sale.customer.name}` : ''}
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };