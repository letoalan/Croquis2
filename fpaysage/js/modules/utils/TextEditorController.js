// TextEditorController.js - Gestionnaire du composant éditeur WYSIWYG

export class TextEditorController {
    static init() {
        const textEditor = document.getElementById('textEditor');
        const formatButtons = document.querySelectorAll('.format-btn');
        const clearBtn = document.getElementById('clearTextBtn');
        const copyBtn = document.getElementById('copyTextBtn');
        const exportBtn = document.getElementById('exportTextBtn');

        formatButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.dataset.command;
                const val = btn.dataset.value;
                if (cmd === 'highlight') {
                    document.execCommand('hiliteColor', false, btn.dataset.color || '#FFFF00');
                } else if (cmd === 'removeFormat') {
                    document.execCommand('removeFormat', false, null);
                } else {
                    document.execCommand(cmd, false, val);
                }
                textEditor?.focus();
            });
        });

        clearBtn?.addEventListener('click', () => {
            if (confirm('Effacer le texte ?')) {
                if (textEditor) textEditor.innerHTML = '';
            }
        });

        copyBtn?.addEventListener('click', () => {
            if (textEditor) navigator.clipboard.writeText(textEditor.innerText || '');
        });

        exportBtn?.addEventListener('click', () => {
            if (!textEditor) return;
            const blob = new Blob([`<html><body>${textEditor.innerHTML}</body></html>`], { type: 'text/html' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'texte.html';
            a.click();
        });
    }
}
