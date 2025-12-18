/**
 * PDF Generator Module
 * Purpose: Generate PDFs from forms and merge attachments
 * Author: James McNeil
 * Date: October 28, 2025
 */

import { sanitizeFilename, logError } from './utils.js';
import { enablePrintMode, disablePrintMode, showAlert } from './ui-handlers.js';

/**
 * Generates a dynamic PDF filename based on form data.
 * Prefixed with "1_" to ensure it appears first when sorted alphabetically.
 * @returns {string} PDF filename
 */
export function getDynamicPdfFilename() {
  const nameInput = document.getElementById('fullName');
  const dateInput = document.getElementById('expenseDate');

  const name = sanitizeFilename(nameInput?.value || 'Unknown');
  const date = sanitizeFilename(dateInput?.value || 'Unknown');

  // Prefix with "1_" to ensure summary PDF sorts before attachments in systems
  // that display attachments alphabetically (e.g., Xero)
  return `1_Expense_Claim_Summary_${name}_${date}.pdf`;
}

/**
 * Generates PDF and downloads it to the user's computer.
 * @returns {Promise<void>}
 */
export async function downloadPDF() {
  try {
    enablePrintMode();

    // Wait for DOM to stabilize after enabling print mode
    await new Promise(resolve => setTimeout(resolve, 300));

    const element = document.querySelector('main.container');
    if (!element) {
      throw new Error('Container element not found');
    }

    // Force a reflow to ensure layout is stable
    element.offsetHeight;

    const opt = {
      margin: [0.3, 0.5, 0.5, 0.5],
      filename: getDynamicPdfFilename(),
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollY: 0,
        windowHeight: element.scrollHeight,
        foreignObjectRendering: false,
        logging: false,
        ignoreElements: (el) => {
          // Ignore browser extension elements and shadow roots
          // Note: shadowRoot is null (not undefined) when absent, so use truthiness check
          if (el.shadowRoot) return true;

          // Common browser extensions that inject elements
          const tagName = el.tagName?.toUpperCase() || '';
          const extensionTags = [
            'GRAMMARLY-EXTENSION',
            'GRAMMARLY-DESKTOP-INTEGRATION',
            'GRAMMARLY-POPUPS',
            'LOOM-SHADOW-ROOT-CONTAINER',
            'LASTPASS-ICON',
            'BITWARDEN-PAGE-ICON'
          ];
          if (extensionTags.includes(tagName)) return true;

          // Check for extension-related attributes
          if (el.hasAttribute('data-lastpass-icon-root')) return true;
          if (el.hasAttribute('data-grammarly-shadow-root')) return true;
          if (el.className?.includes?.('grammarly')) return true;

          return false;
        }
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'css', before: '.page-break' }
    };

    await html2pdf().set(opt).from(element).save();
    
    disablePrintMode();
  } catch (error) {
    disablePrintMode();
    logError('PDF download failed', error);
    showAlert('Failed to download PDF. Please try again.', 'danger');
    throw error;
  }
}

/**
 * Generates a PDF as a base64 string (for form submission).
 * @returns {Promise<string>} Base64 encoded PDF
 */
export async function generatePDFBase64() {
  try {
    enablePrintMode();

    // Wait for DOM to stabilize after enabling print mode
    await new Promise(resolve => setTimeout(resolve, 300));

    const element = document.querySelector('main.container');
    if (!element) {
      throw new Error('Container element not found');
    }

    // Force a reflow to ensure layout is stable
    element.offsetHeight;

    const opt = {
      margin: [0.3, 0.5, 0.5, 0.5],
      filename: getDynamicPdfFilename(),
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollY: 0,
        windowHeight: element.scrollHeight,
        foreignObjectRendering: false,
        logging: false,
        ignoreElements: (el) => {
          // Ignore browser extension elements and shadow roots
          // Note: shadowRoot is null (not undefined) when absent, so use truthiness check
          if (el.shadowRoot) return true;

          // Common browser extensions that inject elements
          const tagName = el.tagName?.toUpperCase() || '';
          const extensionTags = [
            'GRAMMARLY-EXTENSION',
            'GRAMMARLY-DESKTOP-INTEGRATION',
            'GRAMMARLY-POPUPS',
            'LOOM-SHADOW-ROOT-CONTAINER',
            'LASTPASS-ICON',
            'BITWARDEN-PAGE-ICON'
          ];
          if (extensionTags.includes(tagName)) return true;

          // Check for extension-related attributes
          if (el.hasAttribute('data-lastpass-icon-root')) return true;
          if (el.hasAttribute('data-grammarly-shadow-root')) return true;
          if (el.className?.includes?.('grammarly')) return true;

          return false;
        }
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'css', before: '.page-break' }
    };

    const dataUri = await html2pdf().set(opt).from(element).outputPdf('datauristring');
    
    disablePrintMode();
    
    // Extract base64 content from data URI
    const base64 = dataUri.split(',')[1];
    return base64;
  } catch (error) {
    disablePrintMode();
    logError('PDF generation failed', error);
    throw error;
  }
}

/**
 * Merges all attachments (PDFs and images) into a single PDF document using pdf-lib.
 * @returns {Promise<string|null>} Base64 encoded PDF or null if no attachments
 */
export async function mergeAttachmentsPDF() {
  try {
    // Collect all files from all file inputs
    const allFiles = [];
    document.querySelectorAll('input[type="file"]').forEach(input => {
      if (input.files && input.files.length > 0) {
        for (let i = 0; i < input.files.length; i++) {
          allFiles.push(input.files[i]);
        }
      }
    });

    console.log(`[ExpenseClaim] Found ${allFiles.length} attachments to merge.`);

    if (allFiles.length === 0) {
      return null;
    }

    // Check if pdf-lib is available
    const PDFLib = window.PDFLib;
    if (!PDFLib) {
      logError('pdf-lib library not loaded', null);
      return null;
    }

    const { PDFDocument } = PDFLib;

    // Create a new PDF document to hold all merged content
    const mergedPdf = await PDFDocument.create();

    for (const file of allFiles) {
      try {
        const arrayBuffer = await file.arrayBuffer();

        if (file.type === 'application/pdf') {
          // Load the PDF and copy all its pages
          // ignoreEncryption: true allows loading PDFs with encryption metadata (e.g., signed invoices)
          const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          const pageIndices = sourcePdf.getPageIndices();
          const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices);
          copiedPages.forEach(page => mergedPdf.addPage(page));
          console.log(`[ExpenseClaim] Merged PDF: ${file.name} (${pageIndices.length} pages)`);

        } else if (file.type.startsWith('image/')) {
          // Compress and embed image on a new page
          // All images are compressed to JPEG to reduce payload size for Xero API (3.5MB limit)
          const dataUrl = await fileToDataURL(file);
          const compressedBuffer = await compressImageToJpegBuffer(dataUrl);
          if (!compressedBuffer) {
            console.warn(`[ExpenseClaim] Failed to compress image: ${file.name}, skipping`);
            continue;
          }
          const image = await mergedPdf.embedJpg(compressedBuffer);

          // Calculate dimensions to fit on A4 page with margins
          const pageWidth = 595.28; // A4 width in points
          const pageHeight = 841.89; // A4 height in points
          const margin = 40;
          const maxWidth = pageWidth - (margin * 2);
          const maxHeight = pageHeight - (margin * 2) - 30; // Extra space for filename

          const imgDims = image.scale(1);
          let scale = 1;
          if (imgDims.width > maxWidth || imgDims.height > maxHeight) {
            const scaleX = maxWidth / imgDims.width;
            const scaleY = maxHeight / imgDims.height;
            scale = Math.min(scaleX, scaleY);
          }

          const scaledWidth = imgDims.width * scale;
          const scaledHeight = imgDims.height * scale;

          // Center the image on the page
          const x = (pageWidth - scaledWidth) / 2;
          const y = (pageHeight - scaledHeight) / 2 + 15; // Offset for filename at bottom

          const page = mergedPdf.addPage([pageWidth, pageHeight]);
          page.drawImage(image, {
            x,
            y,
            width: scaledWidth,
            height: scaledHeight
          });

          // Add filename at bottom of page
          const { rgb } = PDFLib;
          page.drawText(file.name, {
            x: margin,
            y: 20,
            size: 10,
            color: rgb(0.3, 0.3, 0.3)
          });

          console.log(`[ExpenseClaim] Embedded image: ${file.name}`);

        } else {
          // For unsupported file types, add a placeholder page
          const page = mergedPdf.addPage();
          const { rgb } = PDFLib;
          page.drawText(`Attachment: ${file.name}`, {
            x: 50,
            y: 750,
            size: 14,
            color: rgb(0, 0, 0)
          });
          page.drawText(`File type: ${file.type || 'unknown'}`, {
            x: 50,
            y: 720,
            size: 12,
            color: rgb(0.5, 0.5, 0.5)
          });
          page.drawText('(Content cannot be embedded)', {
            x: 50,
            y: 690,
            size: 12,
            color: rgb(0.5, 0.5, 0.5)
          });
          console.warn(`[ExpenseClaim] Unsupported file type: ${file.type}, added placeholder for ${file.name}`);
        }
      } catch (err) {
        logError(`Failed to process attachment: ${file.name}`, err);
        // Add error page for this file
        const page = mergedPdf.addPage();
        const { rgb } = PDFLib;
        page.drawText(`Error processing: ${file.name}`, {
          x: 50,
          y: 750,
          size: 14,
          color: rgb(0.8, 0, 0)
        });
        page.drawText(`Error: ${err.message || 'Unknown error'}`, {
          x: 50,
          y: 720,
          size: 10,
          color: rgb(0.5, 0.5, 0.5)
        });
      }
    }

    // Save as base64
    const pdfBytes = await mergedPdf.save();
    const base64 = uint8ArrayToBase64(pdfBytes);
    console.log(`[ExpenseClaim] Merged PDF created with ${mergedPdf.getPageCount()} pages.`);
    return base64;
  } catch (error) {
    logError('Attachment merge failed', error);
    return null;
  }
}

/**
 * Converts a Uint8Array to base64 string.
 * @param {Uint8Array} bytes - Byte array to convert
 * @returns {string} Base64 encoded string
 */
function uint8ArrayToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Compresses an image to JPEG with resizing and quality reduction.
 * This significantly reduces file size for API payload limits (Xero: 3.5MB).
 * @param {string} dataUrl - Image data URL
 * @param {object} options - Compression options
 * @param {number} [options.maxDimension=1200] - Max width or height in pixels
 * @param {number} [options.quality=0.7] - JPEG quality (0-1)
 * @returns {Promise<ArrayBuffer|null>} Compressed JPEG as ArrayBuffer or null on failure
 */
function compressImageToJpegBuffer(dataUrl, options = {}) {
  const { maxDimension = 1200, quality = 0.7 } = options;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;

        // Resize if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height / width) * maxDimension);
            width = maxDimension;
          } else {
            width = Math.round((width / height) * maxDimension);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Fill with white background (for PNGs with transparency)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            blob.arrayBuffer().then(resolve).catch(() => resolve(null));
          } else {
            resolve(null);
          }
        }, 'image/jpeg', quality);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

/**
 * Gets the filename for merged attachments PDF.
 * Prefixed with "2_" to ensure it appears after the summary when sorted alphabetically.
 * @returns {string} Filename for merged attachments
 */
export function getAttachmentsPdfFilename() {
  const nameInput = document.getElementById('fullName');
  const dateInput = document.getElementById('expenseDate');

  const name = sanitizeFilename(nameInput?.value || 'Unknown');
  const date = sanitizeFilename(dateInput?.value || 'Unknown');

  // Prefix with "2_" to ensure attachments PDF sorts after summary in systems
  // that display attachments alphabetically (e.g., Xero)
  return `2_Expense_Claim_Receipts_${name}_${date}.pdf`;
}

/**
 * Converts a File to a data URL.
 * @param {File} file - File to convert
 * @returns {Promise<string>} Data URL
 */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Checks if html2pdf library is loaded.
 * @returns {boolean} True if library is available
 */
export function isHtml2PdfAvailable() {
  return typeof html2pdf !== 'undefined';
}

/**
 * Checks if jsPDF library is loaded.
 * @returns {boolean} True if library is available
 */
export function isJsPdfAvailable() {
  return typeof window.jspdf !== 'undefined' && typeof window.jspdf.jsPDF !== 'undefined';
}

/**
 * Checks if pdf-lib library is loaded.
 * @returns {boolean} True if library is available
 */
export function isPdfLibAvailable() {
  return typeof window.PDFLib !== 'undefined' && typeof window.PDFLib.PDFDocument !== 'undefined';
}

/**
 * Validates that all required PDF libraries are loaded.
 * @throws {Error} If libraries are not available
 * @returns {void}
 */
export function validatePdfLibraries() {
  if (!isHtml2PdfAvailable()) {
    throw new Error('html2pdf library is not loaded');
  }
  if (!isJsPdfAvailable()) {
    throw new Error('jsPDF library is not loaded');
  }
  if (!isPdfLibAvailable()) {
    throw new Error('pdf-lib library is not loaded');
  }
}
