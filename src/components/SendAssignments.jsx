import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";

export function SendAssignments() {

    const getLocalISODateTime = () => {
        const now = new Date();
        now.setMinutes(0); // Redondear a la hora exacta (0 minutos)
        now.setSeconds(0); // Redondear a 0 segundos
        now.setMilliseconds(0); // Redondear a 0 milisegundos
        const offset = now.getTimezoneOffset();
        const localDate = new Date(now.getTime() - offset * 60000);
        return localDate.toISOString().slice(0, 16);
    };

    const [selectedData, setSelectedData] = useState([]);
    const [contacts, setContacts] = useState({});
    const [sendDate, setSendDate] = useState(getLocalISODateTime());
    const [animatingAssignments, setAnimatingAssignments] = useState([]);

    useEffect(() => {
        const data = localStorage.getItem('selectedData');
        if (data) {
            const parsedData = JSON.parse(data);
            const updatedData = parsedData.map(item => ({
                week: new Date(item.week),
                assignments: item.assignments.map(assignment => ({
                    ...assignment,
                    message: generateMessage(assignment, new Date(item.week)),
                    proposalContact: null,
                    similarity: null,
                    hasContact: false
                }))
            }));
            setSelectedData(updatedData);
        }
    }, []);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: "array" });
    
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
            const contacts = jsonData
                .slice(1)
                .filter(row => row.length > 1 && row[0] && row[1])
                .map(row => ({
                    nombre: row[0].trim(),
                    telefono: row[1].toString().trim()
                }))
                .sort((a, b) => a.nombre.localeCompare(b.nombre));
    
            setContacts(contacts);
            reviewContacts(contacts);
        };
    
        reader.readAsArrayBuffer(file);
    };

    const removeContacts = () => {
        setContacts({});
        reviewContacts({});
    }

    const generateMessage = (assignment, week) => {
        const title = assignment.title == 'Lector' ? 'Lector del estudio bíblico' : assignment.title;
        let message = `Hola buenas!
Te mando este mensaje como recordatorio de tu asignación.
Es la semana del ${week.toLocaleDateString()}.
Título: ${assignment.duration ? '(' + assignment.duration + ' min.) ' : ''}${title}${assignment.helper ? '\nAyudante: ' + assignment.helper : ''}`;

        return message;
    }

    const handleMessageChange = (idx, subIdx, value) => {
        const updatedData = [...selectedData];
        updatedData[idx].assignments[subIdx].message = value;
        localStorage.setItem('selectedData', JSON.stringify(updatedData));
        setSelectedData(updatedData);
    }

    const handleDateChange = (e) => {
        const selectedDate = new Date(e.target.value);
        selectedDate.setMinutes(0); // Redondear a la hora exacta (0 minutos)
        selectedDate.setSeconds(0); // Redondear a 0 segundos
        selectedDate.setMilliseconds(0); // Redondear a 0 milisegundos

        const localISOTime = selectedDate.toLocaleString('sv-SE'); // Usa 'sv-SE' para formato ISO local
        const formattedDate = localISOTime.slice(0, 16); // Formato adecuado para datetime-local (yyyy-MM-ddTHH:mm)
    
        setSendDate(formattedDate);
    }

    const reviewContacts = (contacts) => {
        const updatedData = [...selectedData];
    
        updatedData.forEach(item => {
            item.assignments.forEach(assignment => {
                const formattedAssignmentName = getFormattedName(assignment.name);
                let foundExactMatch = false;
    
                contacts.forEach(contact => {
                    const formattedContactName = getFormattedName(contact.nombre);
    
                    if (formattedAssignmentName !== '' && formattedContactName !== '') {
                        if (formattedAssignmentName.localeCompare(formattedContactName, undefined, { sensitivity: 'base' }) === 0) {
                            assignment.hasContact = true;
                            foundExactMatch = true;
                        }
                    }
                });
    
                if (!foundExactMatch) {
                    contacts.forEach(contact => {
                        const formattedContactName = getFormattedName(contact.nombre);
    
                        if (formattedAssignmentName !== '' && formattedContactName !== '') {
                            const similarity = getSimilarity(formattedAssignmentName, formattedContactName);
                            if (similarity >= 50) {
                                assignment.proposalContact = contact.nombre;
                                assignment.similarity = similarity.toFixed(2);
                            }
                        }
                    });
                }
            });
        });
    
        setSelectedData(updatedData);
    };
     

    const levenshteinDistance = (a, b) => {
        if (!a || !b) return 0;
        const matrix = [];
    
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
    
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                    );
                }
            }
        }
    
        return matrix[b.length][a.length];
    };
    
    const getSimilarity = (str1, str2) => {
        if (!str1 || !str2) return 0;
        const distance = levenshteinDistance(str1, str2);
        const maxLength = Math.max(str1.length, str2.length);
        return ((maxLength - distance) / maxLength) * 100;
    };  

    const getFormattedName = (name) => {
        return name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "");
    }

    const goBack = () => {
        localStorage.removeItem('selectedData');
        window.location.href = '/pdf-results';
    }

    const sendAssignment = async (idx, subIdx) => {
        const assignment = selectedData[idx].assignments[subIdx];
        const sendAt = new Date(sendDate);

        const contact = contacts.find(
            contact => getFormattedName(contact.nombre) === getFormattedName(assignment.name)
        );

        if (!contact) {
            alert("No se encontró el contacto para:", assignment.name);
            return;
        }

        const url = `https://wa.me/${contact.telefono}?text=${encodeURIComponent(assignment.message)}`;
        window.open(url, '_blank');

        // const response = await fetch('/api/schedule', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         message: assignment.message,
        //         telefono: contact.telefono,
        //         sendAt: sendAt.toISOString(), // Guardar fecha en formato ISO
        //         status: 'pending' // Estado inicial
        //     })
        // });
    
        // const data = await response.json();
    
        // if (data.success) {
            // Marcar el assignment como en proceso de eliminación
            setAnimatingAssignments((prev) => [...prev, `${idx}-${subIdx}`]);

            // Retrasar para la animación
            setTimeout(() => {
                const updatedData = [...selectedData];
                updatedData[idx].assignments.splice(subIdx, 1); // Eliminar el assignment
                localStorage.setItem('selectedData', JSON.stringify(updatedData));
                setSelectedData(updatedData);

                // Eliminar de animatingAssignments después de la eliminación
                setAnimatingAssignments((prev) =>
                    prev.filter((item) => item !== `${idx}-${subIdx}`)
                );
            }, 500);  // Esperamos 1 segundo para que se vea la animación
        // } else {
        //     alert("Hubo un error al enviar el mensaje.");
        // }
    };

    const callScheduler = async () => {
        const response = await fetch('/api/send-whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "hola"
            })
        });
    };


    const contactChange = (contact, value) => {
        const updatedContacts = [...contacts];
        updatedContacts[contacts.indexOf(contact)] = { ...contact, telefono: value };
        setContacts(updatedContacts);
    }

    const handleReferralDecision = (isYes, idx, subIdx) => {
        const updatedData = [...selectedData];
        const assignment = updatedData[idx].assignments[subIdx];
        
        if (isYes) {
            assignment.hasContact = true;
            assignment.name = assignment.proposalContact;
            assignment.proposalContact = null;
        } else {
            assignment.proposalContact = null;
        }
    
        localStorage.setItem('selectedData', JSON.stringify(updatedData));
        setSelectedData(updatedData);
    };

    const sendAll = async () => {
        for (let idx = 0; idx < selectedData.length; idx++) {
            const item = selectedData[idx];
            
            for (let subIdx = 0; subIdx < item.assignments.length; subIdx++) {
                const assignment = item.assignments[subIdx];
                
                if (assignment.hasContact) {
                    await sendAssignment(idx, subIdx);  // Esperar a que se envíe antes de continuar
                    await new Promise(resolve => setTimeout(resolve, 1000));  // Esperar 1 segundo
                }
            }
        }
    };    

    return (
        <>
            <section className="col-span-1 bg-gray-200 h-max-screen">
                <div className="sticky top-0 flex flex-col gap-2 justify-start p-4">
                    { contacts && contacts.length > 0 ? (
                        <button className="bg-gray-400 text-white text-center py-2 rounded-lg mb-2" onClick={removeContacts}>Volver a subir contactos</button>
                    ) : (
                        <div className="flex items-center justify-center w-full mb-2">
                            <label htmlFor="dropzone-file" className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                    </svg>
                                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 text-center"><span className="font-semibold">Haz click para subir tus contactos</span> o arrastralos aquí</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Formato XLSX</p>
                                </div>
                                <input id="dropzone-file" type="file"  accept=".xlsx" onChange={handleFileUpload} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
                            </label>
                        </div> 
                    )}

                    <h2 className="text-2xl">Contactos</h2>
                    <div className="flex flex-col gap-2 justify-start h-[calc(100vh-112px)] overflow-y-auto pb-4">
                        { contacts && contacts.length > 0 ? (
                            contacts.map((contact, idx) => (
                                <div key={idx}>
                                    <label htmlFor={"contacto" + idx} className="block text-md font-medium text-gray-900">{contact.nombre}</label>
                                    <input
                                        type="text"
                                        id={"contacto" + idx}
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                        placeholder="Número del contacto"
                                        value={contact.telefono}
                                        onChange={(e) => contactChange(contact, e.target.value)} 
                                        required
                                    />
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">No hay datos disponibles.</p>
                        )}
                    </div>
                </div>

            </section>

            <section className="col-span-2 p-4 bg-gray-50">
                <button className="bg-gray-400 text-white px-4 py-2 rounded-lg mb-3 cursor-pointer" onClick={() => goBack()}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span className="ml-2">Atrás</span>
                </button>

                {/* <button className="bg-green-600 text-white px-4 py-2 rounded-lg mb-3 cursor-pointer" onClick={() => callScheduler()}>
                    <span className="mr-2">Enviar mensajes</span>
                </button> */}

                {/* <div className="flex justify-between items-center">
                    <h1 className="text-4xl">Mensajes</h1>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg cursor-pointer" onClick={() => sendAll()}>Enviar todos</button>
                </div> */}

                {/* <div className="flex items-center gap-2">
                    <label htmlFor="date" className="text-sm">Mandar los mensajes a esta fecha y hora:</label>
                    <input
                        type="datetime-local"
                        className="border border-gray-300 rounded-lg p-2 text-gray-900 text-sm"
                        onChange={handleDateChange}
                        value={sendDate}
                    />
                </div> */}
                
                { selectedData.length === 0 ? (
                    <p className="text-center text-gray-500">No hay datos disponibles.</p>
                ) : (
                    <div className="space-y-6 flex flex-col gap-4 mt-4">
                        {selectedData.map((item, idx) =>
                            item.assignments.map((assignment, subIdx) => (
                                <div key={`${idx}-${subIdx}`} className={`rounded overflow-hidden shadow-md p-4 mb-0 bg-white ${animatingAssignments.includes(`${idx}-${subIdx}`) ? 'fade-out' : ''}`}>
                                    <div className="flex flex-col gap-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Para: <b>{assignment.name}</b></span>
                                            { assignment.proposalContact ? 
                                                <>
                                                    <span className="text-sm">¿Puede referirse a <b>{assignment.proposalContact}</b>?</span>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            className="bg-green-500 text-white px-4 py-2 rounded-lg"
                                                            onClick={() => handleReferralDecision(true, idx, subIdx)}>
                                                            Sí
                                                        </button>
                                                        <button 
                                                            className="bg-red-500 text-white px-4 py-2 rounded-lg"
                                                            onClick={() => handleReferralDecision(false, idx, subIdx)}>
                                                            No
                                                        </button>
                                                    </div>
                                                </>
                                                : assignment.hasContact ?
                                                '' : 
                                                <span className="text-sm text-red-600">No tienes su contacto</span>
                                            }
                                        </div>
                                        <textarea name={`${idx}-${subIdx}-textarea`} id={`${idx}-${subIdx}-textarea`} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 field-sizing-content" placeholder="Mensaje" value={assignment.message} onChange={(e) => handleMessageChange(idx, subIdx, e.target.value)} required />
                                        <div className="flex items-center justify-end">
                                            <button className="bg-green-700/80 disabled:bg-gray-200 text-white px-4 py-2 rounded-lg cursor-pointer disabled:cursor-default" disabled={assignment.message.length === 0 || !assignment.hasContact} onClick={() => sendAssignment(idx, subIdx)}>Enviar</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
                
            </section>
        </>
    );
}