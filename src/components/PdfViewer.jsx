import { useEffect, useState } from 'react';

export function PdfViewer() {
    const [pdfUrl, setPdfUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Solo acceder a localStorage en el navegador
            const base64Data = localStorage.getItem("pdfData");
            if (base64Data) {
                const byteCharacters = atob(base64Data);
                const byteArray = new Uint8Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteArray[i] = byteCharacters.charCodeAt(i);
                }
                const blob = new Blob([byteArray], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                setPdfUrl(url);
            }
        }
    }, []); // Solo se ejecuta una vez al montar el componente

    if (!pdfUrl) {
        return <div>No PDF available</div>;
    }

    return (
        <iframe src={pdfUrl} width="100%" height="100%" title="PDF Viewer"></iframe>
    );
}
