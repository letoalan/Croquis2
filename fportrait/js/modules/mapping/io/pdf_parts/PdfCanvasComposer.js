// PdfCanvasComposer.js - Composition de la page et génération du fichier jsPDF

export class PdfCanvasComposer {

    static createCompositeCanvas(baseCanvas, titleHeight, mapTitle, extraHeight = 0) {
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = baseCanvas.width;
        finalCanvas.height = baseCanvas.height + titleHeight + extraHeight;
        const ctx = finalCanvas.getContext('2d');

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        if (mapTitle && titleHeight > 0) {
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(mapTitle, finalCanvas.width / 2, titleHeight / 2);
        }

        ctx.drawImage(baseCanvas, 0, titleHeight);
        return { canvas: finalCanvas, ctx };
    }

    static drawControlCanvas(ctx, controlCanvas, x, y) {
        if (!controlCanvas) return;
        ctx.drawImage(controlCanvas, x, y);
    }

    static generatePDF(canvas, mapTitle = 'export') {
        if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF non disponible');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 8;
        const availableWidth = pageWidth - margin * 2;
        const availableHeight = pageHeight - margin * 2;
        const canvasRatio = canvas.width / canvas.height;

        let finalWidth = availableWidth;
        let finalHeight = finalWidth / canvasRatio;

        if (finalHeight > availableHeight) {
            finalHeight = availableHeight;
            finalWidth = finalHeight * canvasRatio;
        }

        const x = (pageWidth - finalWidth) / 2;
        const y = (pageHeight - finalHeight) / 2;

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);

        pdf.setProperties({
            title: mapTitle || 'Carte Interactive',
            subject: 'Export de carte pédagogique',
            author: 'Cartographie Interactive',
            creator: 'Cartographie Interactive'
        });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        pdf.save(`carte_${mapTitle || 'export'}_${timestamp}.pdf`);
    }
}
