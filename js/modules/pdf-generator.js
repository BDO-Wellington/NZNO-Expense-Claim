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
 * @returns {string} PDF filename
 */
export function getDynamicPdfFilename() {
  const nameInput = document.getElementById('fullName');
  const dateInput = document.getElementById('expenseDate');
  
  const name = sanitizeFilename(nameInput?.value || 'Unknown');
  const date = sanitizeFilename(dateInput?.value || 'Unknown');
  
  return `Expense_Claim_Form_${name}_${date}.pdf`;
}

/**
 * Generates PDF and downloads it to the user's computer.
 * @returns {Promise<void>}
 */
export async function downloadPDF() {
  try {
    enablePrintMode();
    
    const element = document.querySelector('.container');
    if (!element) {
      throw new Error('Container element not found');
    }
    
    const opt = {
      margin: [0.3, 0.5, 0.5, 0.5],
      filename: getDynamicPdfFilename(),
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowHeight: element.scrollHeight },
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
    
    const element = document.querySelector('.container');
    if (!element) {
      throw new Error('Container element not found');
    }
    
    const opt = {
      margin: [0.3, 0.5, 0.5, 0.5],
      filename: getDynamicPdfFilename(),
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowHeight: element.scrollHeight },
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
 * Merges all attachments into a single PDF document.
 * @returns {Promise<string|null>} Base64 encoded PDF or null if no attachments
 */
export async function mergeAttachmentsPDF() {
  try {
    // Collect all files from all file inputs
    const allFiles = [];
    document.querySelectorAll('input[type=\"file\"]').forEach(input => {
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
    
    // Check if jsPDF is available
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      logError('jsPDF library not loaded', null);
      return null;
    }
    
    const doc = new jsPDF();
    let firstPage = true;
    
    for (const file of allFiles) {
      if (!firstPage) {
        doc.addPage();
      }
      firstPage = false;
      
      try {
        if (file.type.startsWith('image/')) {
          // Add image to PDF
          const imgData = await fileToDataURL(file);
          doc.addImage(imgData, 'JPEG', 10, 10, 180, 250);
          doc.text(file.name, 10, 265);
        } else if (file.type === 'application/pdf') {
          // For PDF files, just add a placeholder
          // Full PDF merge would require pdf-lib or similar
          doc.text(`[PDF Attachment: ${file.name}]`, 10, 20);
          doc.text('PDF content not embedded', 10, 30);
        } else {
          // For other file types, just show filename
          doc.text(`[File: ${file.name}]`, 10, 20);
          doc.text(`Type: ${file.type || 'unknown'}`, 10, 30);
        }
      } catch (err) {
        logError(`Failed to process attachment: ${file.name}`, err);
        doc.text(`[Error reading file: ${file.name}]`, 10, 20);
      }
    }
    
    // Convert to base64
    const pdfOutput = doc.output('datauristring');
    return pdfOutput.split(',')[1];
  } catch (error) {
    logError('Attachment merge failed', error);
    return null;
  }
}

/**
 * Gets the filename for merged attachments PDF.
 * @returns {string} Filename for merged attachments
 */
export function getAttachmentsPdfFilename() {
  const nameInput = document.getElementById('fullName');
  const dateInput = document.getElementById('expenseDate');
  
  const name = sanitizeFilename(nameInput?.value || 'Unknown');
  const date = sanitizeFilename(dateInput?.value || 'Unknown');
  
  return `Expense_Claim_Form_Attachments_${name}_${date}.pdf`;
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
}
