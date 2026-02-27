const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure uploads/invoices directory exists
const invoicesDir = path.join(__dirname, '../../uploads/invoices');
if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
}

// Helper to create PDF content (reusable for both streaming and saving)
const createPDFContent = (doc, order) => {
    // ─── Header ───────────────────────────────────────
    doc.rect(0, 0, 612, 120).fill('#2C1810');

    doc.fillColor('#F5F0E8').fontSize(28).font('Times-Bold')
        .text('TCS', 50, 35);
    doc.fontSize(10).font('Times-Roman')
        .text('The Co-ord Set Studio', 50, 70);
    doc.fontSize(9)
        .text('Premium Clothing | Local Artisan Service', 50, 85);

    // Receipt title / order number
    doc.fillColor('#F5F0E8').fontSize(22).font('Times-Bold')
        .text('ORDER RECEIPT', 400, 35, { align: 'right' });
    doc.fontSize(10).font('Times-Roman')
        .text(`#${order.orderNumber}`, 50, 70, { align: 'right', width: 510 });
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 50, 85, { align: 'right', width: 510 });

    // ─── Customer Details ──────────────────────────────
    doc.fillColor('#2C1810').fontSize(11).font('Times-Bold')
        .text('BILL TO:', 50, 145);
    doc.fillColor('#444').fontSize(10).font('Times-Roman')
        .text(order.user?.name || 'Customer', 50, 162)
        .text(order.user?.email || '', 50, 177)
        .text(order.user?.phone || '', 50, 192);

    // Shipping address
    doc.fillColor('#2C1810').fontSize(11).font('Times-Bold')
        .text('SHIP TO:', 320, 145);
    const addr = order.shippingAddress;
    doc.fillColor('#444').fontSize(10).font('Times-Roman')
        .text(addr?.fullName || addr?.name || '', 320, 162)
        .text(addr?.street || '', 320, 177)
        .text(`${addr?.city || ''}, ${addr?.state || ''} - ${addr?.pincode || ''}`, 320, 192);

    // ─── Divider ──────────────────────────────────────
    doc.moveTo(50, 220).lineTo(562, 220).lineWidth(1).strokeColor('#D4A574').stroke();

    // ─── Order Status ─────────────────────────────────
    const statusColors = { Pending: '#F59E0B', Confirmed: '#3B82F6', Placed: '#3B82F6', Delivered: '#10B981', Shipped: '#10B981' };
    const statusColor = statusColors[order.status] || '#6B7280';
    doc.roundedRect(50, 232, 100, 22, 11).fill(statusColor);
    doc.fillColor('white').fontSize(9).font('Times-Bold')
        .text(order.status.toUpperCase(), 52, 238, { width: 96, align: 'center' });

    doc.fillColor('#2C1810').fontSize(10).font('Times-Roman')
        .text(`Payment: ${order.paymentMethod} | ${order.paymentStatus}`, 165, 237);

    // ─── Items Table ──────────────────────────────────
    const tableTop = 270;
    // Table header
    doc.rect(50, tableTop, 512, 24).fill('#2C1810');
    doc.fillColor('white').fontSize(9).font('Times-Bold')
        .text('ITEM', 60, tableTop + 7)
        .text('QTY', 350, tableTop + 7)
        .text('PRICE', 400, tableTop + 7)
        .text('TOTAL', 470, tableTop + 7);

    let y = tableTop + 30;
    let rowAlt = false;

    for (const item of order.items) {
        if (rowAlt) doc.rect(50, y - 4, 512, 24).fill('#FAF7F2');
        rowAlt = !rowAlt;
        doc.fillColor('#333').fontSize(9).font('Times-Roman')
            .text(item.name || 'Product', 60, y, { width: 280 })
            .text(item.quantity.toString(), 350, y)
            .text(`₹${item.price.toFixed(2)}`, 400, y)
            .text(`₹${(item.price * item.quantity).toFixed(2)}`, 470, y);
        y += 26;
    }

    // ─── Totals ───────────────────────────────────────
    doc.moveTo(50, y + 10).lineTo(562, y + 10).lineWidth(0.5).strokeColor('#D4A574').stroke();
    y += 20;

    const subtotal = order.totalAmount - (order.shippingCharge || 0);
    doc.fillColor('#555').fontSize(10).font('Times-Roman')
        .text('Subtotal:', 400, y)
        .text(`₹${subtotal.toFixed(2)}`, 470, y);
    y += 18;
    doc.text(`Shipping:`, 400, y)
        .text(order.shippingCharge === 0 ? 'FREE' : `₹${order.shippingCharge}`, 470, y);
    y += 18;

    doc.rect(390, y, 172, 28).fill('#2C1810');
    doc.fillColor('white').fontSize(12).font('Times-Bold')
        .text('TOTAL:', 400, y + 7)
        .text(`₹${order.totalAmount.toFixed(2)}`, 470, y + 7);

    // ─── Footer ───────────────────────────────────────
    y += 60;
    doc.moveTo(50, y).lineTo(562, y).lineWidth(1).strokeColor('#D4A574').stroke();
    y += 15;
    doc.fillColor('#888').fontSize(8).font('Times-Roman')
        .text('Thank you for shopping with TCS – The Co-ord Set Studio!', 50, y, { align: 'center', width: 512 })
        .text('For support contact: support@tcs.com | +91 98765 43210', 50, y + 12, { align: 'center', width: 512 })
        .text('This is a computer-generated receipt and does not require a signature.', 50, y + 24, { align: 'center', width: 512 });
};

// Generate and stream receipt (for direct download via API)
const generateReceipt = async (order, res) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=TCS-Receipt-${order.orderNumber}.pdf`);
    doc.pipe(res);

    createPDFContent(doc, order);
    doc.end();
};

// Generate and save invoice to disk (for auto-creation after payment)
const generateAndSaveInvoice = async (order) => {
    return new Promise((resolve, reject) => {
        try {
            const fileName = `TCS-${order.orderNumber}-${Date.now()}.pdf`;
            const filePath = path.join(invoicesDir, fileName);
            
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const writeStream = fs.createWriteStream(filePath);
            
            doc.pipe(writeStream);
            createPDFContent(doc, order);
            doc.end();

            writeStream.on('finish', () => {
                resolve({
                    invoicePath: `/uploads/invoices/${fileName}`,
                    invoiceUrl: `/uploads/invoices/${fileName}`
                });
            });

            writeStream.on('error', reject);
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = { generateReceipt, generateAndSaveInvoice };
