import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

export function PdfResults() {
    const [jsonData, setJsonData] = useState([]);
    const [openSections, setOpenSections] = useState({});
    const [selectedWeeks, setSelectedWeeks] = useState([]);

    useEffect(() => {
        const data = localStorage.getItem('jsonData');
        if (data) {
            const parsedData = JSON.parse(data);
            const updatedData = parsedData.map(item => ({
                ...item,
                week: new Date(item.week),
            }));

            setJsonData(updatedData);
        }
    }, []);

    // Función para alternar el colapso de una semana
    const toggleSection = (idx) => {
        setOpenSections(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    // Función para seleccionar semanas
    const selectWeek = (idx) => {
        if (selectedWeeks.includes(idx)) {
            setSelectedWeeks(prev => prev.filter(item => item !== idx));
            return;
        }
        setSelectedWeeks(prev => [...prev, idx]);
    };

    const handleChange = (weekIdx, category, field, subIdx, value) => {
        setJsonData(prevData => {
            const updatedData = [...prevData];
            
            if (subIdx !== null && subIdx !== undefined) {
                updatedData[weekIdx].assignments.filter(x => x.category == category)[subIdx][field] = value;
            } else {
                updatedData[weekIdx].assignments.find(x => x.title == category).name = value;
            }
    
            localStorage.setItem('jsonData', JSON.stringify(updatedData));
            return updatedData;
        });
    };

    const goBack = () => {
        localStorage.removeItem('jsonData');
        localStorage.removeItem('pdfData');
        localStorage.removeItem('selectedData');
        window.location.href = '/';
    };

    const save = () => {
        const filteredData = jsonData.filter((_, idx) => selectedWeeks.includes(idx));
        const updatedData = filteredData.map(item => ({
            ...item,
            assignments: item.assignments.map(assignment => ({
                ...assignment,
                message: '',
                sended: false
            }))
        }));
        localStorage.setItem('selectedData', JSON.stringify(updatedData));

        window.location.href = '/send-assignments';
    };

    return (
        <section className="flex flex-col gap-4 w-full">
            <h1 className="text-2xl font-semibold text-center">Resultados del PDF</h1>
            <span>Revisa los datos y selecciona qué avisos enviar.</span>
            
            {jsonData.length === 0 ? (
                <p className="text-center text-gray-500">No hay datos disponibles.</p>
            ) : (
                <div className="space-y-6 flex flex-col gap-4">
                    {jsonData.map((item, idx) => (
                        <div key={idx} className={"rounded overflow-hidden shadow-md p-4 mb-0 bg-white " + (selectedWeeks.includes(idx) ? 'outline outline-2 outline-green-700' : '')}>
                            {/* Botón de colapso */}
                            <div className="flex items-center justify-start gap-4">
                                <input type="checkbox" id={`week-${idx}`} className="checkbox w-4 h-4 accent-green-700" checked={selectedWeeks.includes(idx)} onChange={() => selectWeek(idx)} />
                                <button 
                                    className="flex items-center justify-between w-full text-xl font-semibold"
                                    onClick={() => toggleSection(idx)}
                                >
                                    Semana {item.week.toLocaleDateString()}
                                    { openSections[idx] ? <FontAwesomeIcon icon={faChevronDown} /> : <FontAwesomeIcon icon={faChevronRight} />}
                                </button>
                            </div>

                            {/* Contenido colapsable */}
                            {openSections[idx] && (
                                <div className="mt-4 space-y-6">
                                    <div>
                                        <label htmlFor="presidente" className="block mb-2 text-md font-medium text-gray-900">Presidente</label>
                                        <input
                                            type="text"
                                            id="presidente"
                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                            placeholder="Nombre del presidente"
                                            value={item.assignments.find(x => x.title == "Presidente").name}
                                            onChange={(e) => handleChange(idx, "Presidente", null, null, e.target.value)} 
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div>
                                            <label htmlFor="oracion1" className="block mb-2 text-md font-medium text-gray-900">Oración inicial</label>
                                            <input
                                                type="text"
                                                id="oracion1"
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                                placeholder="Oración inicial"
                                                value={item.assignments.find(x => x.title == "Oración 1").name}
                                                onChange={(e) => handleChange(idx, "Oración 1", null, null, e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="oracion2" className="block mb-2 text-md font-medium text-gray-900">Oración final</label>
                                            <input
                                                type="text"
                                                id="oracion2"
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                                placeholder="Oración final"
                                                value={item.assignments.find(x => x.title == "Oración 2").name}
                                                onChange={(e) => handleChange(idx, "Oración 2", null, null, e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 p-4 bg-teal-700/10 rounded-lg">
                                        <h3>TESOROS DE LA BIBLIA</h3>
                                        {item.assignments.filter(x => x.category == "Tesoros de la Biblia").map((assignment, subIdx) => (
                                            <div key={subIdx}>
                                                <label htmlFor={"tesoros" + subIdx} className="block mb-2 text-md font-medium text-gray-900">{assignment.title}</label>
                                                <input
                                                    type="text"
                                                    id={"tesoros" + subIdx}
                                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                                    placeholder="Tesoros"
                                                    value={assignment.name}
                                                    onChange={(e) => handleChange(idx, "Tesoros de la Biblia", "name", subIdx, e.target.value)}
                                                    required
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-col gap-4 p-4 bg-amber-700/10 rounded-lg">
                                        <h3>SEAMOS MEJORES MAESTROS</h3>
                                        {item.assignments.filter(x => x.category == "Seamos mejores maestros").map((assignment, subIdx) => (
                                            assignment.helper === '' ? (
                                                <div key={subIdx}>
                                                    <label htmlFor={"maestros" + subIdx} className="block mb-2 text-md font-medium text-gray-900">{assignment.title}</label>
                                                    <input
                                                        type="text"
                                                        id={"maestros" + subIdx}
                                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                                        placeholder="Maestros"
                                                        value={assignment.name}
                                                        onChange={(e) => handleChange(idx, "Seamos mejores maestros", "name", subIdx, e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            ) : (
                                                <div key={subIdx} className="grid gap-3 md:gap-6 md:grid-cols-2">
                                                    <div>
                                                        <label htmlFor={"maestros" + subIdx} className="block mb-2 text-md font-medium text-gray-900">{assignment.title}</label>
                                                        <input
                                                            type="text"
                                                            id={"maestros" + subIdx}
                                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                                            placeholder="Maestros"
                                                            value={assignment.name}
                                                            onChange={(e) => handleChange(idx, "Seamos mejores maestros", "name", subIdx, e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label htmlFor={"ayudantes" + subIdx} className="block mb-2 text-md font-medium text-gray-900 hidden md:block">&nbsp;</label>
                                                        <input
                                                            type="text"
                                                            id={"ayudantes" + subIdx}
                                                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                                            placeholder="Ayudantes"
                                                            value={assignment.helper}
                                                            onChange={(e) => handleChange(idx, "Seamos mejores maestros", "helper", subIdx, e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        ))}
                                    </div>

                                    <div className="flex flex-col gap-4 p-4 bg-red-700/10 rounded-lg">
                                        <h3>NUESTRA VIDA CRISTIANA</h3>
                                        {item.assignments.filter(x => x.category == "Nuestra vida cristiana").map((assignment, subIdx) => (
                                            <div key={subIdx}>
                                                <label htmlFor={"nuestra_vida_cristiana" + subIdx} className="block mb-2 text-md font-medium text-gray-900">{assignment.title}</label>
                                                <input
                                                    type="text"
                                                    id={"nuestra_vida_cristiana" + subIdx}
                                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                                    placeholder="Nuestra vida cristiana"
                                                    value={assignment.name}
                                                    onChange={(e) => handleChange(idx, "Nuestra vida cristiana", "name", subIdx, e.target.value)}
                                                    required
                                                />
                                            </div>
                                        ))}
                                        <div>
                                            <label htmlFor="nuestra_vida_cristiana_lector" className="block mb-2 text-md font-medium text-gray-900">Lector del estudio bíblico</label>
                                            <input
                                                type="text"
                                                id="nuestra_vida_cristiana_lector"
                                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                                placeholder="Lector del estudio bíblico"
                                                value={item.assignments.find(x => x.title == "Lector").name}
                                                onChange={(e) => handleChange(idx, "Lector", null, null, e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-between items-center">
                <button className="bg-gray-400 text-white px-4 py-2 rounded-lg" onClick={() => goBack()}>Cancelar</button>
                { jsonData.length !== 0 && (
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-200" onClick={() => save()} disabled={selectedWeeks.length === 0}>Siguiente</button>
                )}
            </div>
        </section>
    );
}
