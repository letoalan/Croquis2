// PdfCanvasComposer.js - Rendu canvas et assemblage jsPDF

export class PdfCanvasComposer {
    static async captureElement(element, scale = 2) {
        if (typeof html2canvas !== 'function') throw new Error('html2canvas not loaded');
        return await html2canvas(element, {
            scale: scale,
            useCORS: true,
            allowTaint: true,
            logging: false
        });
    }

    static generatePDF(canvas) {
        if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF not loaded');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
        pdf.save(`croquis-${new Date().toISOString().slice(0, 10)}.pdf`);
    }
}
