import { useRef } from 'react';
import { FiDownload, FiX, FiCheckCircle } from 'react-icons/fi';
import { formatINR } from '@/lib/utils';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';

function numberToWordsINR(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return 'Rupees Zero Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (n) => {
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10] + ' ';
    } else if (n > 0) {
      str += a[n] + ' ';
    }
    return str.trim();
  };

  let remainder = num;
  const crore = Math.floor(remainder / 10000000);
  remainder %= 10000000;
  const lakh = Math.floor(remainder / 100000);
  remainder %= 100000;
  const thousand = Math.floor(remainder / 1000);
  remainder %= 1000;

  let result = '';
  if (crore) result += convertLessThanOneThousand(crore) + ' Crore ';
  if (lakh) result += convertLessThanOneThousand(lakh) + ' Lakh ';
  if (thousand) result += convertLessThanOneThousand(thousand) + ' Thousand ';
  if (remainder) result += convertLessThanOneThousand(remainder) + ' ';

  return `Rupees ${result.trim()} Only`;
}

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

function generateInvoiceHtml(order, addr, items, invoiceNo, invoiceDate, orderDate, subtotalAmount, totalAmount) {
  const itemsHtml = items
    .map((it, idx) => {
      const lineTotal = Number(it.price * it.qty) || 0;
      const optionParts = [];
      if (it.options?.size) optionParts.push(`Size: ${it.options.size}`);
      if (it.options?.frame) optionParts.push(`Frame: ${it.options.frame}`);
      const optionsStr = optionParts.length
        ? `<div style="font-size: 9px; color: #4b5563; margin-top: 2px;">${optionParts.join(' · ')}</div>`
        : '';

      return `
      <tr>
        <td style="padding: 9px 12px; border: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 9px 12px; border: 1px solid #e5e7eb;">
          <div style="font-weight: 600; color: #111827; font-size: 11px;">${it.title || 'Handcrafted Canvas Artwork'}</div>
          ${optionsStr}
          <div style="font-size: 8.5px; color: #9ca3af; font-style: italic; margin-top: 2px;">Museum-Grade 380 GSM Cotton Canvas · Price includes all taxes</div>
        </td>
        <td style="padding: 9px 12px; border: 1px solid #e5e7eb; text-align: center; font-weight: 500;">${it.qty}</td>
        <td style="padding: 9px 12px; border: 1px solid #e5e7eb; text-align: right; font-family: monospace; color: #374151;">₹${Number(it.price || 0).toLocaleString('en-IN')}</td>
        <td style="padding: 9px 12px; border: 1px solid #e5e7eb; text-align: right; font-family: monospace; font-weight: 700; color: #111827;">₹${lineTotal.toLocaleString('en-IN')}</td>
      </tr>
    `;
    })
    .join('');

  const fullAddress = [addr.line1, addr.line2, addr.city, addr.state, addr.pincode, addr.country || 'India']
    .filter(Boolean)
    .join(', ');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoiceNo} - Dreamz Decor</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-container { width: 100%; max-width: 780px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111827; padding-bottom: 14px; }
    .brand-name { font-family: Georgia, serif; font-size: 22px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #111827; }
    .brand-sub { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #b45309; margin-top: 2px; }
    .studio-details { font-size: 10px; color: #4b5563; margin-top: 6px; line-height: 1.35; }
    .invoice-badge-box { text-align: right; }
    .invoice-badge { background: #111827; color: #ffffff; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; padding: 4px 14px; display: inline-block; }
    .copy-tag { font-size: 9px; text-transform: uppercase; color: #6b7280; letter-spacing: 1px; margin-top: 3px; }
    .meta-details { margin-top: 8px; text-align: right; font-size: 10px; color: #4b5563; line-height: 1.45; }
    .meta-details strong { color: #111827; }
    .addresses { display: flex; justify-content: space-between; gap: 14px; margin-top: 14px; padding-bottom: 14px; border-bottom: 1px solid #e5e7eb; }
    .addr-box { flex: 1; background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 6px; padding: 9px 12px; }
    .addr-title { font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; }
    .addr-name { font-size: 12px; font-weight: 700; color: #111827; margin-top: 2px; }
    .addr-text { font-size: 10px; color: #4b5563; margin-top: 2px; line-height: 1.35; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    th { background: #f3f4f6; color: #374151; font-weight: 700; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left; }
    .summary-section { display: flex; justify-content: space-between; gap: 16px; margin-top: 14px; }
    .deliv-card { flex: 1.1; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 9px 12px; font-size: 10px; }
    .deliv-status { color: #065f46; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; margin-bottom: 3px; }
    .totals-card { flex: 0.9; font-size: 10px; }
    .totals-line { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #f3f4f6; color: #4b5563; }
    .grand-line { display: flex; justify-content: space-between; padding: 6px 0 2px 0; border-top: 2px solid #111827; margin-top: 3px; font-size: 13px; font-weight: 700; color: #111827; }
    .words-note { font-size: 9px; font-style: italic; text-align: right; color: #4b5563; margin-top: 2px; }
    .terms-section { margin-top: 20px; border-top: 1px solid #d1d5db; padding-top: 12px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 9px; color: #6b7280; }
    .terms-text { max-width: 440px; line-height: 1.4; }
    .terms-title { font-weight: 700; text-transform: uppercase; color: #374151; margin-bottom: 3px; }
    .sign-box { text-align: right; width: 160px; }
    .sign-line { border-bottom: 1px solid #9ca3af; margin: 6px 0; }
    .sign-name { font-family: Georgia, serif; font-style: italic; font-size: 13px; font-weight: 700; color: #111827; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div>
        <div class="brand-name">DREAMZ DECOR</div>
        <div class="brand-sub">Luxury Handcrafted Canvas Art Studio</div>
        <div class="studio-details">
          Grand Trunk Road, Baba Phoola Singh<br>
          Amritsar, Punjab – 143001, India<br>
          Email: dreamzdecor30@gmail.com · Phone: +91 82848 65051
        </div>
      </div>
      <div class="invoice-badge-box">
        <div class="invoice-badge">INVOICE</div>
        <div class="copy-tag">Customer Receipt</div>
        <div class="meta-details">
          <div>Invoice No: <strong>${invoiceNo}</strong></div>
          <div>Invoice Date: <strong>${invoiceDate}</strong></div>
          <div>Order ID: <strong>#${String(order._id).slice(-8).toUpperCase()}</strong></div>
          <div>Order Date: <strong>${orderDate}</strong></div>
        </div>
      </div>
    </div>

    <div class="addresses">
      <div class="addr-box">
        <div class="addr-title">Billed To / Customer</div>
        <div class="addr-name">${addr.name || 'Valued Art Collector'}</div>
        <div class="addr-text">Phone: ${addr.phone || 'N/A'}</div>
        ${addr.state ? `<div class="addr-text">State: ${addr.state}</div>` : ''}
      </div>
      <div class="addr-box">
        <div class="addr-title">Delivery Destination</div>
        <div class="addr-text" style="margin-top: 3px;">${fullAddress}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 36px; text-align: center;">#</th>
          <th>Description of Artwork &amp; Specifications</th>
          <th style="width: 50px; text-align: center;">Qty</th>
          <th style="width: 140px; text-align: right;">Price (Incl. all taxes)</th>
          <th style="width: 120px; text-align: right;">Total (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="summary-section">
      <div class="deliv-card">
        <div class="deliv-status">✓ Order Successfully Delivered</div>
        <div style="color: #4b5563; margin-top: 3px;">
          <strong>Payment Mode:</strong> ${order.payment?.method === 'cod' ? 'Cash On Delivery' : 'Online (Razorpay)'}
        </div>
        ${order.payment?.paidAt ? `<div style="color: #4b5563;"><strong>Payment Date:</strong> ${fmtDate(order.payment.paidAt)}</div>` : ''}
        ${order.payment?.razorpayPaymentId ? `<div style="color: #4b5563; font-family: monospace; font-size: 9px;"><strong>Txn Ref:</strong> ${order.payment.razorpayPaymentId}</div>` : ''}
        <div style="font-size: 8.5px; color: #6b7280; margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
          Backed by DreamzDecor 100% Free Doorstep Replacement Guarantee.
        </div>
      </div>

      <div class="totals-card">
        <div class="totals-line">
          <span>Subtotal (${items.length} ${items.length === 1 ? 'item' : 'items'}):</span>
          <span style="font-family: monospace; font-weight: 500; color: #111827;">₹${subtotalAmount.toLocaleString('en-IN')}</span>
        </div>
        ${
          order.discount > 0
            ? `
          <div class="totals-line" style="color: #b91c1c;">
            <span>Discount:</span>
            <span style="font-family: monospace; font-weight: 500;">− ₹${Number(order.discount).toLocaleString('en-IN')}</span>
          </div>
        `
            : ''
        }
        <div class="totals-line">
          <span>Shipping &amp; Delivery:</span>
          <span style="font-weight: 700; color: #047857;">FREE</span>
        </div>
        <div class="totals-line">
          <span>Taxes:</span>
          <span style="font-weight: 500; color: #111827;">Price includes all taxes</span>
        </div>
        <div class="grand-line">
          <span>Grand Total:</span>
          <span style="font-family: monospace;">₹${totalAmount.toLocaleString('en-IN')}</span>
        </div>
        <div class="words-note">${numberToWordsINR(totalAmount)}</div>
      </div>
    </div>

    <div class="terms-section">
      <div class="terms-text">
        <div class="terms-title">Terms &amp; Conditions</div>
        <p>1. All product prices are inclusive of all taxes.</p>
        <p>2. Goods are covered under our 100% Free Doorstep Replacement Guarantee for any transit defects.</p>
        <p>3. This is an official computer-generated invoice and requires no physical signature.</p>
      </div>
      <div class="sign-box">
        <div style="font-weight: 600; text-transform: uppercase; color: #374151;">For DREAMZ DECOR</div>
        <div class="sign-line"></div>
        <div class="sign-name">Dreamz Decor</div>
        <div style="font-size: 8.5px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">Authorized Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export default function OrderInvoiceModal({ open, onClose, order }) {
  useBodyScrollLock(open);
  const printRef = useRef(null);

  if (!open || !order) return null;

  const addr = order.shippingAddress || {};
  const items = order.items || [];
  const invoiceNo = `INV-DD-${String(order._id).slice(-8).toUpperCase()}`;
  const invoiceDate = fmtDate(order.updatedAt || order.createdAt);
  const orderDate = fmtDate(order.createdAt);
  const totalAmount = Number(order.total) || 0;
  const subtotalAmount = Number(order.subtotal || order.total) || 0;

  const handleDownloadPDF = () => {
    const invoiceHtml = generateInvoiceHtml(
      order,
      addr,
      items,
      invoiceNo,
      invoiceDate,
      orderDate,
      subtotalAmount,
      totalAmount
    );

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('title', 'Invoice Print Frame');
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!frameDoc) {
      window.print();
      return;
    }

    frameDoc.open();
    frameDoc.write(invoiceHtml);
    frameDoc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/75 backdrop-blur-xs no-print"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Container */}
      <div className="relative z-10 flex w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden my-auto max-h-[92vh]">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print flex shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">Invoice Preview</span>
            <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 tracking-wider uppercase">
              Delivered
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-gray-950 shadow-xs transition hover:bg-amber-400"
            >
              <FiDownload size={13} />
              <span>Download / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition"
              aria-label="Close invoice"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-100">
          <div
            ref={printRef}
            id="standard-tax-invoice"
            className="invoice-paper mx-auto w-full max-w-[800px] bg-white p-6 sm:p-10 shadow-sm border border-gray-200 text-gray-900 font-sans text-xs leading-normal"
          >
            {/* Header: Company & Invoice Title */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-gray-900 pb-5">
              <div>
                <h1 className="font-serif text-2xl font-bold tracking-wider text-gray-950 uppercase">
                  DREAMZ DECOR
                </h1>
                <p className="text-[11px] font-medium tracking-widest text-amber-700 uppercase mt-0.5">
                  Luxury Handcrafted Canvas Art Studio
                </p>
                <div className="mt-2 text-[11px] text-gray-600 leading-relaxed">
                  <p>Grand Trunk Road, Baba Phoola Singh</p>
                  <p>Amritsar, Punjab – 143001, India</p>
                  <p>Email: dreamzdecor30@gmail.com · Phone: +91 82848 65051</p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="inline-block bg-gray-950 text-white px-4 py-1.5 font-bold text-xs uppercase tracking-widest rounded-xs">
                  INVOICE
                </div>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
                  Customer Receipt
                </p>
                <div className="mt-2 space-y-1 text-[11px]">
                  <p>
                    <span className="text-gray-500">Invoice No:</span>{' '}
                    <strong className="font-mono font-semibold">{invoiceNo}</strong>
                  </p>
                  <p>
                    <span className="text-gray-500">Invoice Date:</span>{' '}
                    <strong className="font-medium">{invoiceDate}</strong>
                  </p>
                  <p>
                    <span className="text-gray-500">Order ID:</span>{' '}
                    <strong className="font-mono">{`#${String(order._id).slice(-8).toUpperCase()}`}</strong>
                  </p>
                  <p>
                    <span className="text-gray-500">Order Date:</span> <span>{orderDate}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Billed To & Shipped To Grid */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-200 pb-5">
              <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Billed To / Customer
                </p>
                <p className="font-semibold text-gray-950 mt-1 text-sm">
                  {addr.name || 'Valued Art Collector'}
                </p>
                <p className="text-gray-600 mt-0.5">Phone: {addr.phone || 'N/A'}</p>
                {addr.state && <p className="text-gray-600 mt-0.5">State: {addr.state}</p>}
              </div>

              <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Delivery Destination
                </p>
                <div className="mt-1 text-gray-700 leading-snug">
                  {addr.line1 && <p>{addr.line1}</p>}
                  {addr.line2 && <p>{addr.line2}</p>}
                  <p>{[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</p>
                  <p>{addr.country || 'India'}</p>
                </div>
              </div>
            </div>

            {/* Itemized Table (Clean retail invoice: no GST/tax columns) */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left border-collapse border border-gray-200 text-[11px]">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 uppercase font-semibold text-[10px] border-b border-gray-200">
                    <th className="py-2.5 px-3 border-r border-gray-200 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 border-r border-gray-200">Description of Artwork &amp; Finish</th>
                    <th className="py-2.5 px-3 border-r border-gray-200 text-center w-16">Qty</th>
                    <th className="py-2.5 px-3 border-r border-gray-200 text-right w-32">Price (Incl. all taxes)</th>
                    <th className="py-2.5 px-3 text-right w-32">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((it, idx) => {
                    const lineTotal = Number(it.price * it.qty) || 0;
                    const optionParts = [];
                    if (it.options?.size) optionParts.push(`Size: ${it.options.size}`);
                    if (it.options?.frame) optionParts.push(`Frame: ${it.options.frame}`);

                    return (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-3 px-3 border-r border-gray-200 text-center text-gray-500 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 border-r border-gray-200">
                          <p className="font-semibold text-gray-900">{it.title || 'Handcrafted Canvas Artwork'}</p>
                          {optionParts.length > 0 && (
                            <p className="text-[10px] text-gray-600 mt-0.5">
                              {optionParts.join(' · ')}
                            </p>
                          )}
                          <p className="text-[9px] text-gray-400 mt-0.5 italic">
                            Museum-Grade 380 GSM Cotton Canvas · Price includes all taxes
                          </p>
                        </td>
                        <td className="py-3 px-3 border-r border-gray-200 text-center font-medium">
                          {it.qty}
                        </td>
                        <td className="py-3 px-3 border-r border-gray-200 text-right font-mono text-gray-800">
                          {formatINR(it.price)}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold font-mono text-gray-950">
                          {formatINR(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations & Summary Section */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* Payment & Delivery Status */}
              <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50 text-[11px] space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs uppercase tracking-wide">
                  <FiCheckCircle size={14} className="text-emerald-600" />
                  <span>Order Successfully Delivered</span>
                </div>
                <p className="text-gray-600">
                  <strong>Payment Mode:</strong>{' '}
                  <span className="uppercase">{order.payment?.method === 'cod' ? 'Cash On Delivery' : 'Online (Razorpay)'}</span>
                </p>
                {order.payment?.paidAt && (
                  <p className="text-gray-600">
                    <strong>Payment Date:</strong> {fmtDate(order.payment.paidAt)}
                  </p>
                )}
                {order.payment?.razorpayPaymentId && (
                  <p className="text-gray-600 font-mono text-[10px]">
                    <strong>Txn Ref:</strong> {order.payment.razorpayPaymentId}
                  </p>
                )}
                <p className="text-[10px] text-gray-500 pt-1 border-t border-gray-200 leading-normal">
                  All DreamzDecor orders are backed by our 100% Free Doorstep Replacement Guarantee for transit damages.
                </p>
              </div>

              {/* Financial Totals */}
              <div className="text-[11px] space-y-1.5">
                <div className="flex justify-between py-1 border-b border-gray-100 text-gray-600">
                  <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'}):</span>
                  <span className="font-mono font-medium text-gray-900">
                    {formatINR(subtotalAmount)}
                  </span>
                </div>

                {order.discount > 0 && (
                  <div className="flex justify-between py-1 border-b border-gray-100 text-sale">
                    <span>Discount:</span>
                    <span className="font-mono font-medium">− {formatINR(order.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-gray-100 text-gray-600">
                  <span>Shipping &amp; Delivery:</span>
                  <span className="font-semibold text-emerald-700">FREE</span>
                </div>

                <div className="flex justify-between py-1 border-b border-gray-100 text-gray-600">
                  <span>Taxes:</span>
                  <span className="font-medium text-gray-700">Price includes all taxes</span>
                </div>

                <div className="flex justify-between py-2 border-t-2 border-gray-900 text-sm font-bold text-gray-950">
                  <span>Grand Total (INR):</span>
                  <span className="font-mono text-base">{formatINR(totalAmount)}</span>
                </div>

                <p className="text-[10px] text-gray-600 italic text-right pt-0.5">
                  {numberToWordsINR(totalAmount)}
                </p>
              </div>
            </div>

            {/* Signatory & Terms */}
            <div className="mt-8 border-t border-gray-300 pt-5 flex flex-col sm:flex-row justify-between items-end gap-4 text-[10px] text-gray-500">
              <div className="max-w-md space-y-1">
                <p className="font-bold text-gray-700 uppercase tracking-wider">Terms &amp; Conditions:</p>
                <p>1. All product prices are inclusive of all taxes.</p>
                <p>2. Goods are covered under our 100% Free Doorstep Replacement Guarantee for any transit defects.</p>
                <p>3. This is an official computer-generated invoice and requires no physical signature.</p>
              </div>

              <div className="text-right sm:text-right w-44">
                <p className="text-gray-700 font-semibold uppercase tracking-wider">For DREAMZ DECOR</p>
                <div className="my-2 border-b border-gray-400 w-36 ml-auto" />
                <p className="font-serif italic text-gray-900 text-sm font-bold">Dreamz Decor</p>
                <p className="text-[9px] uppercase tracking-wider text-gray-600">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
