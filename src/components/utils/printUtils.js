// src/components/utils/printUtils.js
export const printReceipt = async (receipt, paymentMethod, cashierName) => {
  const printWindow = window.open('', '_blank');
  
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const receiptNumber = receipt.receiptNumber || receipt.id || receipt.mpesaReceiptNumber || `TEMP-${Date.now().toString().slice(-6)}`;
  const formattedPaymentMethod = paymentMethod ? paymentMethod.replace('_', ' ') : (receipt.paymentMethod || 'CASH');

  // Calculate totals if not provided
  const subtotal = receipt.subtotal || receipt.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = receipt.discount || receipt.items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
  const taxableAmount = subtotal - discount;
  const tax = receipt.tax || taxableAmount * 0.16;
  const total = receipt.total || taxableAmount + tax;

  const receiptContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            width: 80mm;
            margin: 0;
            padding: 0;
          }
        }
      </style>
    </head>
    <body class="font-sans p-4 w-full max-w-[80mm] mx-auto">
      <!-- Header -->
      <div class="text-center mb-4">
        <div class="text-xl font-bold tracking-tight">INVENTORY STORE</div>
        <div class="text-xs text-gray-600">123 Business Street, Nairobi</div>
        <div class="text-xs text-gray-600">Tel: +254 700 000000</div>
      </div>

      <!-- Receipt Info -->
      <div class="flex justify-between text-xs mb-4 border-b pb-2">
        <div>
          <div class="font-semibold">Date:</div>
          <div>${receipt.date ? new Date(receipt.date).toLocaleString() : formattedDate}</div>
          ${cashierName ? `<div class="font-semibold mt-1">Cashier:</div><div>${cashierName}</div>` : ''}
        </div>
        <div class="text-right">
          <div class="font-semibold">Receipt #:</div>
          <div>${receiptNumber}</div>
        </div>
      </div>

      <!-- Items Table -->
      <div class="mb-2">
        <div class="grid grid-cols-12 gap-1 text-xs font-semibold border-b pb-1 mb-1">
          <div class="col-span-6">ITEM</div>
          <div class="col-span-2 text-right">QTY</div>
          <div class="col-span-2 text-right">PRICE</div>
          <div class="col-span-2 text-right">TOTAL</div>
        </div>
        
        ${(receipt.items || []).map(item => {
          const itemPrice = item.price - (item.discount || 0);
          const itemTotal = itemPrice * item.quantity;
          return `
          <div class="grid grid-cols-12 gap-1 text-xs border-b border-dashed py-1">
            <div class="col-span-6 truncate">${item.productName || item.name || 'Item'}</div>
            <div class="col-span-2 text-right">${item.quantity || 0}</div>
            <div class="col-span-2 text-right">${itemPrice.toFixed(2)}</div>
            <div class="col-span-2 text-right font-medium">${itemTotal.toFixed(2)}</div>
          </div>
          ${item.discount > 0 ? `
          <div class="grid grid-cols-12 gap-1 text-xs text-green-600">
            <div class="col-span-8">- Discount (${item.name})</div>
            <div class="col-span-4 text-right">- ${(item.discount * item.quantity).toFixed(2)}</div>
          </div>
          ` : ''}
          `;
        }).join('')}
      </div>

      <!-- Totals -->
      <div class="text-sm mt-4 space-y-1">
        <div class="flex justify-between">
          <span>Subtotal:</span>
          <span class="font-medium">Ksh ${subtotal.toFixed(2)}</span>
        </div>
        <div class="flex justify-between text-green-600">
          <span>Discount:</span>
          <span class="font-medium">- Ksh ${discount.toFixed(2)}</span>
        </div>
        <div class="flex justify-between">
          <span>Tax (16%):</span>
          <span class="font-medium">Ksh ${tax.toFixed(2)}</span>
        </div>
        <div class="flex justify-between border-t pt-1 font-bold text-base">
          <span>TOTAL:</span>
          <span>Ksh ${total.toFixed(2)}</span>
        </div>
        <div class="flex justify-between text-xs mt-2">
          <span class="font-semibold">Payment Method:</span>
          <span class="uppercase">${formattedPaymentMethod}</span>
        </div>
        ${receipt.mpesaReceiptNumber ? `
          <div class="flex justify-between text-xs">
            <span class="font-semibold">M-Pesa Receipt:</span>
            <span>${receipt.mpesaReceiptNumber}</span>
          </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div class="text-center text-xs mt-6 pt-2 border-t border-dashed">
        ${receipt.customerName ? `<div class="mb-1">Customer: ${receipt.customerName}</div>` : ''}
        <div class="font-semibold">Thank you for your business!</div>
        <div class="text-gray-600 mt-1">* Items cannot be returned/exchanged *</div>
        <div class="text-[10px] mt-2">
          <div>Powered by Inventory Management System</div>
          <div>${now.getFullYear()} © All Rights Reserved</div>
        </div>
      </div>

      <script>
        setTimeout(() => {
          window.print();
          window.close();
        }, 300);
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(receiptContent);
  printWindow.document.close();
};