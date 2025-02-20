import * as pdfjsLib from "pdfjs-dist";
import { GlobalWorkerOptions } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export function FileUploader() {

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Data = btoa(
                new Uint8Array(e.target.result).reduce((data, byte) => data + String.fromCharCode(byte), "")
            );
            localStorage.setItem("pdfData", base64Data);

            const data = new Uint8Array(e.target.result);
            const loadingTask = pdfjsLib.getDocument({ data });
            const pdf = await loadingTask.promise;
            let extractedText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
            
                let fixedText = "";
                let prevItem = "";
            
                textContent.items.forEach((item) => {
                    if (item.str === "") {
                        fixedText += "\n";
                    } else if (item.str == " " && item.width > 15) {
                        fixedText += "\n";
                    } else if (prevItem && /^[\u0300-\u036f]$/.test(item.str)) {
                        fixedText = fixedText.slice(0, -1) + item.str;
                    } else {
                        fixedText += item.str;
                    }
                    prevItem = item.str;
                });
            
                extractedText += fixedText + "\n";
            }
            const json = generateJson(extractedText);

            localStorage.setItem('jsonData', JSON.stringify(json));
            window.location.href = '/pdf-results';
        };

        reader.readAsArrayBuffer(file);
    };

    const generateJson = (text) => {
        const lines = text.split("\n");

        const jsonData = [];
        let currentDate = null;
        let currentItem = {};
        let category = '';
        let oracion = 1;

        for (const [index, line] of lines.entries()) {
            if (isTextADate(line)) {
                if (currentDate) {
                    jsonData.push(currentItem);
                }

                currentDate = line;
                currentItem = {
                    week: new Date(Date.parse(formatDate(currentDate))),
                    assignments: []
                };

                oracion = 1;
                
                continue;
            }

            if (!currentDate) {
                continue;
            }
            
            const formattedLine = line
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            if (formattedLine.includes('oracion')) {
                currentItem.assignments.push({
                    title: `Oración ${oracion}`,
                    name: line.split('(')[0]
                });

                if (oracion == 1) {
                    oracion = 2;
                } else {
                    oracion = 1;
                }
            }

            else if (formattedLine.includes('comentarios de apertura')) {
                currentItem.assignments.push({
                    title: 'Presidente',
                    name: lines[index + 1]
                });
            }

            else if (formattedLine.includes('lector')) {
                currentItem.assignments.push({
                    title: 'Lector',
                    name: line.split('(')[0]
                });
            }

            else if (formattedLine.includes('tesoros de la biblia')) {
                category = 'Tesoros de la Biblia';
            }

            else if (formattedLine.includes('seamos mejores maestros')) {
                category = 'Seamos mejores maestros';
            }

            else if (formattedLine.includes('nuestra vida cristiana')) {
                category = 'Nuestra vida cristiana';
            }

            if (!category || formattedLine.includes('comentarios de conclusion')) {
                continue;
            }

            const match = line.match(/^(\d+)\s*(.*)/);

            if (match) {
                const duration = parseInt(match[1], 10);
                const title = match[2].trim(); 
                let name = lines[index + 1];
                let helper = '';

                if (name.includes('(') && name.includes(')')) {
                    name = lines[index + 2];
                }

                if (name.includes('/')) {
                    helper = name.split('/')[1];
                    name = name.split('/')[0];
                }
                
                currentItem.assignments.push({
                    duration,
                    title,
                    category,
                    name,
                    helper
                });
            }
        }

        jsonData.push(currentItem);

        return jsonData;
    }

    const isTextADate = (dateStr) =>{
        return !isNaN(Date.parse(formatDate(dateStr))) && dateStr.includes('/');
    }

    const formatDate = (dateStr) => {
        const [day, month, year] = dateStr.split('/'); 
        return `${year}-${month}-${day}`;
    };

    return (
        <section className="flex flex-col gap-8 w-full">
            <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Haz click para subir un archivo</span> o arrástralo aquí</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Formato PDF</p>
                    </div>
                    <input id="dropzone-file" type="file"  accept=".pdf" onChange={handleFileUpload} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
                </label>
            </div> 
        </section>
    )
}